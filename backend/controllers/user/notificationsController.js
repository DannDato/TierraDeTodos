import handleError from '../../handlers/handleError.js';
import { models } from '../../models/index.js';
import { notificationWindowWhere } from '../../helpers/notifications.js';

class NotificationsController {
  list = async (req, res) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
      const where = { userId: req.user.id, archivedAt: null };
      if (String(req.query.unread) === 'true') where.readAt = null;
      const result = await models.UserNotifications.findAndCountAll({
        where,
        include: [{ model: models.Notifications, as: 'notification', where: notificationWindowWhere(), required: true }],
        order: [[{ model: models.Notifications, as: 'notification' }, 'createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      });
      return res.json({ notifications: result.rows, pagination: { page, limit, total: result.count, pages: Math.ceil(result.count / limit) } });
    } catch (error) {
      return handleError(res, req, error, 'Error al consultar notificaciones');
    }
  };

  unreadCount = async (req, res) => {
    try {
      const count = await models.UserNotifications.count({
        where: { userId: req.user.id, readAt: null, archivedAt: null },
        include: [{ model: models.Notifications, as: 'notification', where: notificationWindowWhere(), required: true }],
      });
      return res.json({ count });
    } catch (error) {
      return handleError(res, req, error, 'Error al consultar contador de notificaciones');
    }
  };

  markSeen = async (req, res) => this.updateState(req, res, { seenAt: new Date() }, 'Notificación marcada como vista');
  markRead = async (req, res) => this.updateState(req, res, { seenAt: new Date(), readAt: new Date() }, 'Notificación marcada como leída');
  archive = async (req, res) => this.updateState(req, res, { archivedAt: new Date() }, 'Notificación archivada');

  updateState = async (req, res, updates, action) => {
    try {
      const row = await models.UserNotifications.findOne({ where: { id: req.params.id, userId: req.user.id } });
      if (!row) return res.status(404).json({ message: 'Notificación no encontrada' });
      await row.update(updates);
      await req.logAction({ accion: action, apartado: 'Notifications', userId: req.user.id, username: req.user.username, valor: `userNotificationId=${row.id}`, type: 'info' });
      return res.json({ notification: row });
    } catch (error) {
      return handleError(res, req, error, 'Error al actualizar notificación');
    }
  };

  markAllRead = async (req, res) => {
    try {
      const [updated] = await models.UserNotifications.update({ seenAt: new Date(), readAt: new Date() }, { where: { userId: req.user.id, readAt: null, archivedAt: null } });
      await req.logAction({ accion: 'Todas las notificaciones marcadas como leídas', apartado: 'Notifications', userId: req.user.id, username: req.user.username, valor: `updated=${updated}`, type: 'info' });
      return res.json({ updated });
    } catch (error) {
      return handleError(res, req, error, 'Error al marcar notificaciones como leídas');
    }
  };
}

const ctrlNotifications = new NotificationsController();
export { ctrlNotifications };
