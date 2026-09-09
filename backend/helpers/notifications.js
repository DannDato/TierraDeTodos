import { Op, UniqueConstraintError } from 'sequelize';
import { db, models } from '../models/index.js';

const TYPES = ['SYSTEM', 'NEWS', 'MODERATION', 'TICKET', 'MENTION', 'ACHIEVEMENT', 'EMBLEM', 'ACCOUNT', 'EVENT', 'SECURITY'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];
const isUniqueError = (error) => error instanceof UniqueConstraintError || error?.name === 'SequelizeUniqueConstraintError';

const validateData = (data = {}) => {
  if (!TYPES.includes(data.type)) throw new Error('Tipo de notificación inválido');
  if (!PRIORITIES.includes(data.priority || 'NORMAL')) throw new Error('Prioridad de notificación inválida');
  if (!data.title || !data.message) throw new Error('Título y mensaje son obligatorios');
  if (data.actionTarget && (!String(data.actionTarget).startsWith('/') || String(data.actionTarget).startsWith('//'))) throw new Error('Destino de notificación inválido');
};

const createNotification = async (data, transaction) => {
  validateData(data);
  if (data.key) {
    const existing = await models.Notifications.findOne({ where: { key: data.key }, transaction });
    if (existing) return { notification: existing, created: false };
  }
  try {
    return { notification: await models.Notifications.create({ ...data, priority: data.priority || 'NORMAL' }, { transaction }), created: true };
  } catch (error) {
    if (!data.key || !isUniqueError(error)) throw error;
    const existing = await models.Notifications.findOne({ where: { key: data.key }, transaction });
    if (!existing) throw error;
    return { notification: existing, created: false };
  }
};

const deliver = async (notificationId, userIds, transaction) => {
  const uniqueUsers = [...new Set(userIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  for (const userId of uniqueUsers) {
    try {
      await models.UserNotifications.create({ userId, notificationId }, { transaction });
    } catch (error) {
      if (!isUniqueError(error)) throw error;
    }
  }
  return uniqueUsers;
};

const logNotification = async (req, action, notification, recipients) => {
  if (!req?.logAction) return;
  try {
    await req.logAction({ accion: action, apartado: 'Notifications', userId: req.user?.id, username: req.user?.username, valor: `notificationId=${notification.id}; recipients=${recipients.length}`, type: 'info' });
  } catch { /* no romper el flujo principal por auditoría */ }
};

export const NotifyUser = async (userId, notificationData, req) => {
  const transaction = await db.transaction();
  try {
    const { notification, created } = await createNotification(notificationData, transaction);
    const recipients = await deliver(notification.id, [userId], transaction);
    await transaction.commit();
    await logNotification(req, created ? 'Notificación creada y entregada' : 'Notificación entregada idempotentemente', notification, recipients);
    return { notification, recipients, created };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const NotifyUsers = async (userIds, notificationData, req) => {
  const transaction = await db.transaction();
  try {
    const { notification, created } = await createNotification(notificationData, transaction);
    const recipients = await deliver(notification.id, userIds, transaction);
    await transaction.commit();
    await logNotification(req, created ? 'Notificación múltiple creada y entregada' : 'Notificación múltiple entregada idempotentemente', notification, recipients);
    return { notification, recipients, created };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const NotifyAll = async (notificationData, req) => {
  const users = await models.Users.findAll({ attributes: ['id'] });
  return NotifyUsers(users.map((user) => user.id), notificationData, req);
};

export const notificationWindowWhere = () => ({
  isActive: true,
  [Op.and]: [
    { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: new Date() } }] },
    { [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }] },
  ],
});
