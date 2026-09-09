import { Op } from 'sequelize';
import { models } from '../models/index.js';
import { NotifyUser } from './notifications.js';

export const reconcileRecentNotifications = async ({ since = new Date(Date.now() - 15 * 60 * 1000) } = {}) => {
  const reached = await models.UserAchievements.findAll({
    where: { isReached: true, reachedAt: { [Op.gte]: since } },
    include: [{ model: models.Achievements, as: 'achievement', where: { isActive: true }, required: true }],
  });
  for (const row of reached) {
    await NotifyUser(row.userId, { key: `ACHIEVEMENT_REACHED:${row.userId}:${row.achievementId}`, type: 'ACHIEVEMENT', category: 'achievements', title: '¡Logro desbloqueado!', message: row.achievement.name, priority: 'NORMAL', entityType: 'ACHIEVEMENT', entityId: row.achievementId, actionTarget: '/progress', icon: row.achievement.icon || 'Award', metadata: { rarity: row.achievement.rarity, achievementKey: row.achievement.key } });
  }

  const emblems = await models.user_emblems.findAll({ where: { earnedAt: { [Op.gte]: since } }, include: [{ model: models.emblems, as: 'emblem', required: true }] });
  for (const row of emblems) {
    await NotifyUser(row.userId, { key: `EMBLEM_ACHIEVED:${row.userId}:${row.emblemId}`, type: 'EMBLEM', category: 'achievements', title: '¡Nuevo emblema!', message: row.emblem.name, priority: 'NORMAL', entityType: 'EMBLEM', entityId: row.emblemId, actionTarget: '/progress', icon: row.emblem.iconUrl || 'Award', metadata: { rarity: row.emblem.rarity } });
  }

  return { achievements: reached.length, emblems: emblems.length };
};
