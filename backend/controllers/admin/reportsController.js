import { Op, literal } from 'sequelize';
import { QueryTypes } from 'sequelize';

import { db, models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

const normalizeText = (value) => String(value || '').trim();
const parseBool = (value) => String(value).toLowerCase() === 'true';
const POLICE_TICKET_TYPE_KEYS = ['REPORTE', 'REPORTE_ROBO'];

class AdminReportsController {
  getTicketPermissions = async (userId) => {
    const permissionRows = await db.query(
      `
        SELECT s.key
        FROM user_permissions up
        INNER JOIN Permissions s ON s.key = up.permission
        WHERE up.userId = :userId
        AND s.active = 1
        AND s.key IN ('tickets.view', 'tickets.manage', 'tickets.police', 'tickets.close')
      `,
      {
        replacements: { userId },
        type: QueryTypes.SELECT
      }
    );

    return new Set(permissionRows.map((row) => row.key));
  };

  getTicketAccessScope = (permissionKeys) => {
    const canManageTickets = permissionKeys.has('tickets.manage');
    const canViewAllTickets = canManageTickets || permissionKeys.has('tickets.view');
    const canViewPoliceTickets = permissionKeys.has('tickets.police');
    const canCloseTickets = permissionKeys.has('tickets.close');

    return {
      canManageTickets,
      canViewAllTickets,
      canViewPoliceTickets,
      canCloseTickets
    };
  };

  canAccessTicketType = (ticketTypeKey, accessScope) => {
    if (accessScope.canViewAllTickets) return true;
    if (!accessScope.canViewPoliceTickets) return false;
    return POLICE_TICKET_TYPE_KEYS.includes(String(ticketTypeKey || '').trim().toUpperCase());
  };

  // GET /admin/reports/tickets
  // Default: solo ABIERTO. Con switches se complementa CERRADO/RECHAZADO.
  getTickets = async (req, res) => {
    try {
      const permissionKeys = await this.getTicketPermissions(req.user.id);
      const accessScope = this.getTicketAccessScope(permissionKeys);

      if (!accessScope.canViewAllTickets && !accessScope.canViewPoliceTickets) {
        return res.status(403).json({ message: 'No autorizado para este apartado' });
      }

      const q = normalizeText(req.query?.q).slice(0, 200);
      const includeClosed = parseBool(req.query?.includeClosed);
      const includeRejected = parseBool(req.query?.includeRejected);

      const statuses = ['ABIERTO'];
      if (includeClosed) statuses.push('CERRADO');
      if (includeRejected) statuses.push('RECHAZADO');

      const where = {
        statusKey: { [Op.in]: statuses }
      };

      if (!accessScope.canViewAllTickets && accessScope.canViewPoliceTickets) {
        where.typeKey = { [Op.in]: POLICE_TICKET_TYPE_KEYS };
      }

      if (q) {
        const escapedQ = q.replace(/[%_\\]/g, '\\$&');
        where[Op.or] = [
          { subject: { [Op.like]: `%${escapedQ}%` } },
          { '$author.username$': { [Op.like]: `%${escapedQ}%` } },
          { ticketCode: { [Op.like]: `%${escapedQ}%` } }
        ];
      }

      const tickets = await models.tickets.findAll({
        where,
        include: [
          {
            model: models.Users,
            as: 'author',
            attributes: ['id', 'username'],
            required: false
          }
        ],
        order: [
          [literal("CASE `tickets`.`priority_key` WHEN 'URGENTE' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 WHEN 'BAJA' THEN 4 ELSE 5 END"), 'ASC'],
          ['createdAt', 'ASC']
        ]
      });

      const ticketIds = tickets.map((ticket) => Number(ticket.id)).filter((id) => Number.isInteger(id) && id > 0);

      let unreadByTicketId = new Map();
      if (ticketIds.length > 0) {
        const unreadRows = await db.query(
          `
            SELECT ticket_id AS ticketId, COUNT(*) AS unreadCount
            FROM tickets_messages
            WHERE ticket_id IN (:ticketIds)
            AND seen_by_admin = 0
            AND source_screen = 'TICKETS'
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
        delete t.id;
        return {
          ...t,
          unreadCount: unreadByTicketId.get(Number(ticket.id)) || 0
        };
      });

      const canCloseTicket = accessScope.canCloseTickets;

      await req.logAction({
        accion: 'Bandeja de reportes consultada',
        apartado: 'Reports',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `tickets=${ticketsWithUnread.length}; includeClosed=${includeClosed}; includeRejected=${includeRejected}; q=${q || ''}`,
        type: 'info'
      });

      return res.status(200).json({ tickets: ticketsWithUnread, canCloseTicket });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener reportes de tickets');
    }
  };

  // GET /admin/reports/tickets/:ticketCode/messages
  getMessages = async (req, res) => {
    try {
      const permissionKeys = await this.getTicketPermissions(req.user.id);
      const accessScope = this.getTicketAccessScope(permissionKeys);

      if (!accessScope.canViewAllTickets && !accessScope.canViewPoliceTickets) {
        return res.status(403).json({ message: 'No autorizado para este apartado' });
      }

      const ticketCode = String(req.params.id || req.params.ticketCode || '').trim();
      if (!ticketCode) return res.status(400).json({ message: 'Ticket code inválido' });

      const ticket = await models.tickets.findOne({
        where: { ticketCode },
        include: [
          {
            model: models.Users,
            as: 'author',
            attributes: ['id', 'username'],
            required: false
          }
        ]
      });

      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      if (!this.canAccessTicketType(ticket.typeKey, accessScope)) {
        return res.status(403).json({ message: 'No autorizado para ver este ticket' });
      }

      await models.tickets_messages.update(
        { seenByAdmin: true },
        {
          where: {
            ticketId: ticket.id,
            seenByAdmin: false
          }
        }
      );

      const messages = await models.tickets_messages.findAll({
        where: { ticketId: ticket.id },
        order: [['createdAt', 'ASC'], ['id', 'ASC']]
      });

      await req.logAction({
        accion: 'Mensajes de reporte consultados',
        apartado: 'Reports',
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

  // POST /admin/reports/tickets/:ticketCode/messages
  addMessageAsSystem = async (req, res) => {
    try {
      const ticketCode = String(req.params.id || req.params.ticketCode || '').trim();
      if (!ticketCode) return res.status(400).json({ message: 'Ticket code inválido' });

      const ticket = await models.tickets.findOne({ where: { ticketCode } });
      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      if (ticket.statusKey !== 'ABIERTO') {
        return res.status(403).json({
          message: 'No se pueden agregar mensajes a un ticket cerrado o rechazado'
        });
      }

      const message = normalizeText(req.body?.message);
      if (!message) return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
      if (message.length > 5000) return res.status(400).json({ message: 'El mensaje no puede superar 5000 caracteres' });

      const created = await models.tickets_messages.create({
        ticketId: ticket.id,
        userId: req.user.id,
        authorUsername: 'Sistema',
        authorRole: 'SYSTEM',
        sourceScreen: 'REPORTS',
        seenByUser: false,
        seenByAdmin: true,
        message
      });

      await req.logAction({
        accion: 'Respuesta administrativa enviada a ticket',
        apartado: 'Reports',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `ticketCode=${ticketCode}; messageId=${created.id}`,
        type: 'info'
      });

      return res.status(201).json({ message: created });
    } catch (error) {
      handleError(res, req, error, 'Error al responder ticket como sistema');
    }
  };

  // PATCH /admin/reports/tickets/:ticketCode/close
  closeTicket = async (req, res) => {
    try {
      const ticketCode = String(req.params.id || req.params.ticketCode || '').trim();
      if (!ticketCode) return res.status(400).json({ message: 'Ticket code inválido' });

      const ticket = await models.tickets.findOne({ where: { ticketCode } });
      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      if (ticket.statusKey !== 'ABIERTO') {
        return res.status(409).json({ message: 'Solo se pueden cerrar tickets abiertos' });
      }

      await ticket.update({ statusKey: 'CERRADO' });

      await req.logAction({
        accion: 'Ticket cerrado por administrador',
        apartado: 'Reports',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `ticketCode=${ticketCode}; targetUserId=${ticket.userId}`,
        type: 'info'
      });

      // Eliminar id, exponer solo ticketCode
      const ticketObj = ticket.toJSON();
      delete ticketObj.id;
      return res.status(200).json({
        message: 'Ticket cerrado correctamente',
        ticket: ticketObj
      });
    } catch (error) {
      handleError(res, req, error, 'Error al cerrar ticket');
    }
  };

  rejectTicket = async (req, res) => {
    try {
      const ticketCode = String(req.params.id || req.params.ticketCode || '').trim();
      if (!ticketCode) return res.status(400).json({ message: 'Ticket code inválido' });

      const ticket = await models.tickets.findOne({ where: { ticketCode } });
      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      if (ticket.statusKey !== 'ABIERTO') {
        return res.status(409).json({ message: 'Solo se pueden rechazar tickets abiertos' });
      }

      await ticket.update({ statusKey: 'RECHAZADO' });

      await req.logAction({
        accion: 'Ticket rechazado por administrador',
        apartado: 'Reports',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `ticketCode=${ticketCode}; targetUserId=${ticket.userId}`,
        type: 'info'
      });

      // Eliminar id, exponer solo ticketCode
      const ticketObj = ticket.toJSON();
      delete ticketObj.id;
      return res.status(200).json({
        message: 'Ticket rechazado correctamente',
        ticket: ticketObj
      });
    } catch (error) {
      handleError(res, req, error, 'Error al rechazar ticket');
    }
  };
}

const ctrlAdminReports = new AdminReportsController();
export { ctrlAdminReports };

