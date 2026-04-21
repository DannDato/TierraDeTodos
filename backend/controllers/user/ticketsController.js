import { db, models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

const MAX_OPEN_TICKETS = 2;

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

      const ticketsWithUnread = await Promise.all(
        tickets.map(async (ticket) => {
          const unreadCount = await models.tickets_messages.count({
            where: {
              ticketId: ticket.id,
              seenByUser: false,
              sourceScreen: 'REPORTS'
            }
          });

          return {
            ...ticket.toJSON(),
            unreadCount
          };
        })
      );

      return res.status(200).json({ tickets: ticketsWithUnread });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener tickets');
    }
  };

  // POST /user/tickets — crea un ticket nuevo
  createTicket = async (req, res) => {
    try {
      const userId = req.user.id;

      // Verificar límite de tickets abiertos
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
      const involvedPlayer = normalizeText(req.body?.involvedPlayer) || null;
      const description = normalizeText(req.body?.description);
      const evidence   = normalizeText(req.body?.evidence) || null;
      const coordX     = parseOptionalNumber(req.body?.coordX);
      const coordY     = parseOptionalNumber(req.body?.coordY);
      const coordZ     = parseOptionalNumber(req.body?.coordZ);

      if (!typeKey || !priorityKey || !subject || !description) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }

      const hasAnyCoord = [coordX, coordY, coordZ].some((v) => v !== null);
      if (hasAnyCoord && ![coordX, coordY, coordZ].every((v) => Number.isFinite(v))) {
        return res.status(400).json({ message: 'Si envías coordenadas, X, Y y Z deben ser numéricas' });
      }

      // Validar que type y priority existan y estén activos
      const [type, priority] = await Promise.all([
        models.ticket_types.findOne({ where: { key: typeKey, active: 'YES' } }),
        models.tickets_prioritys.findOne({ where: { key: priorityKey, active: 'YES' } })
      ]);

      if (!type)     return res.status(400).json({ message: 'Tipo de ticket inválido' });
      if (!priority) return res.status(400).json({ message: 'Prioridad de ticket inválida' });

      const ticket = await db.transaction(async (transaction) => {
        const createdTicket = await models.tickets.create({
          userId,
          typeKey,
          priorityKey,
          statusKey: 'ABIERTO',
          subject,
          involvedPlayer,
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

      return res.status(201).json({ ticket });
    } catch (error) {
      handleError(res, req, error, 'Error al crear ticket');
    }
  };

  // GET /user/tickets/:id/messages — mensajes de un ticket (solo el dueño)
  getMessages = async (req, res) => {
    try {
      const userId   = req.user.id;
      const ticketId = Number(req.params.id);

      if (!ticketId) return res.status(400).json({ message: 'ID inválido' });

      const ticket = await models.tickets.findOne({
        where: { id: ticketId, userId }
      });

      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      await models.tickets_messages.update(
        { seenByUser: true },
        {
          where: {
            ticketId,
            seenByUser: false
          }
        }
      );

      const messages = await models.tickets_messages.findAll({
        where: { ticketId },
        order: [['createdAt', 'ASC'], ['id', 'ASC']]
      });

      return res.status(200).json({ ticket, messages });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener mensajes del ticket');
    }
  };

  // POST /user/tickets/:id/messages — agrega mensaje (solo si ABIERTO y es el dueño)
  addMessage = async (req, res) => {
    try {
      const userId   = req.user.id;
      const ticketId = Number(req.params.id);

      if (!ticketId) return res.status(400).json({ message: 'ID inválido' });

      const ticket = await models.tickets.findOne({
        where: { id: ticketId, userId }
      });

      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      if (ticket.statusKey !== 'ABIERTO') {
        return res.status(403).json({
          message: 'No se pueden agregar mensajes a un ticket cerrado o rechazado'
        });
      }

      const message = normalizeText(req.body?.message);
      if (!message) return res.status(400).json({ message: 'El mensaje no puede estar vacío' });

      const created = await models.tickets_messages.create({
        ticketId,
        userId,
        authorUsername: req.user.username,
        authorRole: 'USER',
        sourceScreen: 'TICKETS',
        seenByUser: true,
        seenByAdmin: false,
        message
      });

      return res.status(201).json({ message: created });
    } catch (error) {
      handleError(res, req, error, 'Error al enviar mensaje');
    }
  };
}

const ctrlTickets = new TicketsController();
export { ctrlTickets };
