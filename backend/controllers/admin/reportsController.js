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

      const q = normalizeText(req.query?.q);
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
        const maybeId = Number(q);
        where[Op.or] = [
          { subject: { [Op.like]: `%${q}%` } },
          { involvedPlayer: { [Op.like]: `%${q}%` } },
          { '$author.username$': { [Op.like]: `%${q}%` } }
        ];

        if (Number.isInteger(maybeId) && maybeId > 0) {
          where[Op.or].push({ id: maybeId });
        }
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
        // Prioriza urgencia y dentro de cada prioridad atiende más viejo primero.
        order: [
          [literal("CASE `tickets`.`priority_key` WHEN 'URGENTE' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 WHEN 'BAJA' THEN 4 ELSE 5 END"), 'ASC'],
          ['createdAt', 'ASC']
        ]
      });

      const ticketsWithUnread = await Promise.all(
        tickets.map(async (ticket) => {
          const unreadCount = await models.tickets_messages.count({
            where: {
              ticketId: ticket.id,
              seenByAdmin: false,
              sourceScreen: 'TICKETS'
            }
          });

          return {
            ...ticket.toJSON(),
            unreadCount
          };
        })
      );

      const canCloseTicket = accessScope.canCloseTickets;

      return res.status(200).json({ tickets: ticketsWithUnread, canCloseTicket });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener reportes de tickets');
    }
  };

  // GET /admin/reports/tickets/:id/messages
  getMessages = async (req, res) => {
    try {
      const permissionKeys = await this.getTicketPermissions(req.user.id);
      const accessScope = this.getTicketAccessScope(permissionKeys);

      if (!accessScope.canViewAllTickets && !accessScope.canViewPoliceTickets) {
        return res.status(403).json({ message: 'No autorizado para este apartado' });
      }

      const ticketId = Number(req.params.id);
      if (!ticketId) return res.status(400).json({ message: 'ID inválido' });

      const ticket = await models.tickets.findOne({
        where: { id: ticketId },
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
            ticketId,
            seenByAdmin: false
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

  // POST /admin/reports/tickets/:id/messages
  addMessageAsSystem = async (req, res) => {
    try {
      const ticketId = Number(req.params.id);
      if (!ticketId) return res.status(400).json({ message: 'ID inválido' });

      const ticket = await models.tickets.findByPk(ticketId);
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
        userId: req.user.id,
        authorUsername: 'Sistema',
        authorRole: 'SYSTEM',
        sourceScreen: 'REPORTS',
        seenByUser: false,
        seenByAdmin: true,
        message
      });

      return res.status(201).json({ message: created });
    } catch (error) {
      handleError(res, req, error, 'Error al responder ticket como sistema');
    }
  };

  // PATCH /admin/reports/tickets/:id/close
  closeTicket = async (req, res) => {
    try {
      const ticketId = Number(req.params.id);
      if (!ticketId) return res.status(400).json({ message: 'ID inválido' });

      const ticket = await models.tickets.findByPk(ticketId);
      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      if (ticket.statusKey !== 'ABIERTO') {
        return res.status(409).json({ message: 'Solo se pueden cerrar tickets abiertos' });
      }

      await ticket.update({ statusKey: 'CERRADO' });

      return res.status(200).json({
        message: 'Ticket cerrado correctamente',
        ticket
      });
    } catch (error) {
      handleError(res, req, error, 'Error al cerrar ticket');
    }
  };
}

const ctrlAdminReports = new AdminReportsController();
export { ctrlAdminReports };
