import { UniqueConstraintError } from 'sequelize';
import { models } from '../models/index.js';
import { setStat } from './achievementEngine.js';
import { NotifyUser } from './notifications.js';

const logAchievement = async (req, action, userId, emblemId, type = 'info') => {
  if (!req?.logAction) return;

  await req.logAction({
    accion: action,
    apartado: 'Achievements',
    userId,
    valor: `emblemId=${emblemId}`,
    type,
  });
};

/**
 * Otorga un emblema de forma idempotente.
 * La unicidad real la garantiza el índice user_emblems_user_emblem_unique.
 */
export const emblemReach = async (userId, emblemId, req, options = {}) => {
  const normalizedUserId = Number(userId);
  const normalizedEmblemId = Number(emblemId);

  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error('Usuario inválido para otorgar emblema');
  }
  if (!Number.isInteger(normalizedEmblemId) || normalizedEmblemId <= 0) {
    throw new Error('Emblema inválido');
  }

  const [user, emblem] = await Promise.all([
    models.Users.findByPk(normalizedUserId, { attributes: ['id', 'username'] }),
    models.emblems.findByPk(normalizedEmblemId),
  ]);

  if (!user) throw new Error('Usuario no encontrado');
  if (!emblem) throw new Error('Emblema no encontrado');

  const existing = await models.user_emblems.findOne({
    where: { userId: normalizedUserId, emblemId: normalizedEmblemId },
  });

  if (existing) return { achieved: false, userEmblem: existing, emblem };

  try {
    const userEmblem = await models.user_emblems.create({
      userId: normalizedUserId,
      emblemId: normalizedEmblemId,
      editionId: emblem.editionId,
    });

    await logAchievement(req, 'Emblema obtenido', normalizedUserId, normalizedEmblemId);
    try {
      const emblemCount = await models.user_emblems.count({ where: { userId: normalizedUserId } });
      await setStat(normalizedUserId, 'EMBLEMS_ACHIEVED', emblemCount, req);
    } catch (statError) {
      await logAchievement(req, 'No se pudo actualizar EMBLEMS_ACHIEVED', normalizedUserId, `${normalizedEmblemId}; error=${statError.message}`, 'error');
    }
    if (options.notify !== false) {
      try {
        await NotifyUser(normalizedUserId, { key: `EMBLEM_ACHIEVED:${normalizedUserId}:${normalizedEmblemId}`, type: 'EMBLEM', category: 'achievements', title: '¡Nuevo emblema!', message: emblem.name, priority: 'NORMAL', entityType: 'EMBLEM', entityId: normalizedEmblemId, actionTarget: '/progress', icon: emblem.iconUrl || 'Award', metadata: { rarity: emblem.rarity } }, req);
      } catch (notificationError) {
        await logAchievement(req, 'No se pudo crear notificación de emblema', normalizedUserId, `${normalizedEmblemId}; error=${notificationError.message}`, 'error');
      }
    }
    return { achieved: true, userEmblem, emblem };
  } catch (error) {
    if (!(error instanceof UniqueConstraintError) && error.name !== 'SequelizeUniqueConstraintError') {
      throw error;
    }

    const concurrentAssignment = await models.user_emblems.findOne({
      where: { userId: normalizedUserId, emblemId: normalizedEmblemId },
    });

    if (!concurrentAssignment) throw error;
    return { achieved: false, userEmblem: concurrentAssignment, emblem };
  }
};

export default emblemReach;
