// Generador de ticketCode aleatorio único (32 caracteres)
const generateTicketCode = async () => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code, exists = true;
  while (exists) {
    code = Array.from({ length: 32 }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
    // Verifica unicidad en la base de datos
    // eslint-disable-next-line no-await-in-loop
    exists = await models.tickets.findOne({ where: { ticketCode: code }, attributes: ['id'] });
  }
  return code;
};
import { db, models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

const MAX_OPEN_TICKETS = 2;
const MAX_SUBJECT = 200;
const MAX_DESCRIPTION = 5000;
const MAX_EVIDENCE = 500;
const MAX_MESSAGE = 5000;

const normalizeText = (value) => String(value || '').trim();
const parseOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

class TicketsController {
  // GET /user/tickets — lista los tickets del usuario autenticado
  getMyTickets = async (req, res) => {
    try {
      const userId = req.user.id;

      const tickets = await models.tickets.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });

      const ticketIds = tickets.map((ticket) => Number(ticket.id)).filter((id) => Number.isInteger(id) && id > 0);

      let unreadByTicketId = new Map();
      if (ticketIds.length > 0) {
        const unreadRows = await db.query(
          `
            SELECT ticket_id AS ticketId, COUNT(*) AS unreadCount
            FROM tickets_messages
            WHERE ticket_id IN (:ticketIds)
            AND seen_by_user = 0
            AND source_screen = 'REPORTS'
            GROUP BY ticket_id
          `,
          {
            replacements: { ticketIds },
            type: db.QueryTypes.SELECT
          }
        );

        unreadByTicketId = new Map(
          unreadRows.map((row) => [Number(row.ticketId), Number(row.unreadCount) || 0])
        );
      }

      const ticketsWithUnread = tickets.map((ticket) => {
        const t = ticket.toJSON();
        // Eliminar id, exponer solo ticketCode
        delete t.id;
        return {
          ...t,
          unreadCount: unreadByTicketId.get(Number(ticket.id)) || 0
        };
      });

      await req.logAction({
        accion: 'Tickets del usuario consultados',
        apartado: 'Tickets',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `tickets=${ticketsWithUnread.length}`,
        type: 'info'
      });

      return res.status(200).json({ tickets: ticketsWithUnread });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener tickets');
    }
  };

  // POST /user/tickets â€” crea un ticket nuevo
  createTicket = async (req, res) => {
    try {
      const userId = req.user.id;

      // Verificar lÃ­mite de tickets abiertos
      const openCount = await models.tickets.count({
        where: { userId, statusKey: 'ABIERTO' }
      });

      if (openCount >= MAX_OPEN_TICKETS) {
        return res.status(409).json({
          message: `Ya tienes ${MAX_OPEN_TICKETS} tickets abiertos. Cierra uno antes de crear otro.`
        });
      }

      const typeKey    = normalizeText(req.body?.typeKey);
      const priorityKey = normalizeText(req.body?.priorityKey);
      const subject    = normalizeText(req.body?.subject);
      const description = normalizeText(req.body?.description);
      const evidence   = normalizeText(req.body?.evidence) || null;
      const coordX     = parseOptionalNumber(req.body?.coordX);
      const coordY     = parseOptionalNumber(req.body?.coordY);
      const coordZ     = parseOptionalNumber(req.body?.coordZ);

      if (!typeKey || !priorityKey || !subject || !description) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }

      if (subject.length > MAX_SUBJECT) {
        return res.status(400).json({ message: `El asunto no puede superar ${MAX_SUBJECT} caracteres` });
      }
      if (description.length > MAX_DESCRIPTION) {
        return res.status(400).json({ message: `La descripciÃ³n no puede superar ${MAX_DESCRIPTION} caracteres` });
      }
      if (evidence && evidence.length > MAX_EVIDENCE) {
        return res.status(400).json({ message: `La evidencia no puede superar ${MAX_EVIDENCE} caracteres` });
      }

      const hasAnyCoord = [coordX, coordY, coordZ].some((v) => v !== null);
      if (hasAnyCoord && ![coordX, coordY, coordZ].every((v) => Number.isFinite(v))) {
        return res.status(400).json({ message: 'Si envÃ­as coordenadas, X, Y y Z deben ser numÃ©ricas' });
      }

      // Validar que type y priority existan y estÃ©n activos
      const [type, priority] = await Promise.all([
        models.catalog.findOne({ where: { category: 'ticket_type', key: typeKey, active: 'YES' } }),
        models.catalog.findOne({ where: { category: 'ticket_priority', key: priorityKey, active: 'YES' } })
      ]);

      if (!type)     return res.status(400).json({ message: 'Tipo de ticket invÃ¡lido' });
      if (!priority) return res.status(400).json({ message: 'Prioridad de ticket invÃ¡lida' });

      const ticket = await db.transaction(async (transaction) => {
        const ticketCode = await generateTicketCode();
        const createdTicket = await models.tickets.create({
          ticketCode,
          userId,
          typeKey,
          priorityKey,
          statusKey: 'ABIERTO',
          subject,
          coordX,
          coordY,
          coordZ,
          description,
          evidence
        }, { transaction });

        // Primer mensaje de conversación: la descripción inicial del usuario
        await models.tickets_messages.create({
          ticketId: createdTicket.id,
          userId,
          authorUsername: req.user.username,
          authorRole: 'USER',
          sourceScreen: 'TICKETS',
          seenByUser: true,
          seenByAdmin: false,
          message: description
        }, { transaction });

        return createdTicket;
      });

      await req.logAction({
        accion: 'Ticket creado correctamente',
        apartado: 'Tickets',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `ticketCode=${ticket.ticketCode}; typeKey=${typeKey}; priorityKey=${priorityKey}`,
        type: 'info'
      });

      // Eliminar id, exponer solo ticketCode
      const ticketObj = ticket.toJSON();
      delete ticketObj.id;
      return res.status(201).json({ ticket: { ...ticketObj, unreadCount: 0 } });
    } catch (error) {
      handleError(res, req, error, 'Error al crear ticket');
    }
  };

  // GET /user/tickets/:ticketCode/messages — mensajes de un ticket (solo el dueño)
  getMessages = async (req, res) => {
    try {
      const userId   = req.user.id;
      const ticketCode = String(req.params.id || req.params.ticketCode || '').trim();

      if (!ticketCode) return res.status(400).json({ message: 'Ticket code inválido' });

      const ticket = await models.tickets.findOne({
        where: { ticketCode, userId }
      });

      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      await models.tickets_messages.update(
        { seenByUser: true },
        {
          where: {
            ticketId: ticket.id,
            seenByUser: false
          }
        }
      );

      const messages = await models.tickets_messages.findAll({
        where: { ticketId: ticket.id },
        order: [['createdAt', 'ASC'], ['id', 'ASC']]
      });

      await req.logAction({
        accion: 'Mensajes de ticket consultados',
        apartado: 'Tickets',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `ticketCode=${ticketCode}; messages=${messages.length}`,
        type: 'info'
      });

      // Eliminar id, exponer solo ticketCode
      const ticketObj = ticket.toJSON();
      delete ticketObj.id;
      return res.status(200).json({ ticket: ticketObj, messages });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener mensajes del ticket');
    }
  };

  // POST /user/tickets/:ticketCode/messages — agrega mensaje (solo si ABIERTO y es el dueño)
  addMessage = async (req, res) => {
    try {
      const userId   = req.user.id;
      const ticketCode = String(req.params.id || req.params.ticketCode || '').trim();

      if (!ticketCode) return res.status(400).json({ message: 'Ticket code inválido' });

      const ticket = await models.tickets.findOne({
        where: { ticketCode, userId }
      });

      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      if (ticket.statusKey !== 'ABIERTO') {
        return res.status(403).json({
          message: 'No se pueden agregar mensajes a un ticket cerrado o rechazado'
        });
      }

      const message = normalizeText(req.body?.message);
      if (!message) return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
      if (message.length > MAX_MESSAGE) return res.status(400).json({ message: `El mensaje no puede superar ${MAX_MESSAGE} caracteres` });

      const created = await models.tickets_messages.create({
        ticketId: ticket.id,
        userId,
        authorUsername: req.user.username,
        authorRole: 'USER',
        sourceScreen: 'TICKETS',
        seenByUser: true,
        seenByAdmin: false,
        message
      });

      await req.logAction({
        accion: 'Mensaje agregado a ticket',
        apartado: 'Tickets',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `ticketCode=${ticketCode}; messageId=${created.id}`,
        type: 'info'
      });

      return res.status(201).json({ message: created });
    } catch (error) {
      handleError(res, req, error, 'Error al enviar mensaje');
    }
  };
}

const ctrlTickets = new TicketsController();
export { ctrlTickets };

