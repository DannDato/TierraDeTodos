import handleError from '../../handlers/handleError.js';
import { models } from '../../models/index.js';
import { Op } from 'sequelize';

const toNumber = (value) => Number(value || 0);

const serializeAchievement = (achievement, progress) => {
  const reached = Boolean(progress?.isReached);
  const plain = achievement.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    name: plain.isSecret && !reached ? 'Achievement secreto' : plain.name,
    description: plain.isSecret && !reached ? 'Sigue jugando para descubrir este achievement.' : plain.description,
    hint: plain.isSecret && !reached ? null : plain.hint,
    type: plain.type,
    rarity: plain.rarity,
    goal: toNumber(plain.goal),
    operator: plain.operator,
    isSecret: Boolean(plain.isSecret),
    points: plain.points,
    icon: plain.icon,
    sortOrder: plain.sortOrder,
    prizeEmblem: plain.prizeEmblem ? {
      id: plain.prizeEmblem.id,
      name: plain.prizeEmblem.name,
      iconUrl: plain.prizeEmblem.iconUrl,
      rarity: plain.prizeEmblem.rarity,
      color: plain.prizeEmblem.color,
    } : null,
    progress: toNumber(progress?.progress),
    isReached: reached,
    reachedAt: progress?.reachedAt || null,
  };
};

class AchievementProgressController {
  getAchievements = async (req, res) => {
    try {
      const [achievements, userProgress] = await Promise.all([
        models.Achievements.findAll({
          where: { isActive: true },
          include: [{ model: models.emblems, as: 'prizeEmblem', attributes: ['id', 'name', 'iconUrl', 'rarity', 'color'], required: false }],
          order: [['sortOrder', 'ASC'], ['id', 'ASC']],
        }),
        models.UserAchievements.findAll({ where: { userId: req.user.id } }),
      ]);
      const progressByAchievement = new Map(userProgress.map((item) => [item.achievementId, item]));
      const result = achievements.map((achievement) => serializeAchievement(achievement, progressByAchievement.get(achievement.id)));
      await req.logAction({ accion: 'Achievements del usuario consultados', apartado: 'Achievements', userId: req.user.id, username: req.user.username, valor: `count=${result.length}`, type: 'info' });
      return res.json({ achievements: result });
    } catch (error) {
      return handleError(res, req, error, 'Error al consultar achievements del usuario');
    }
  };

  getStats = async (req, res) => {
    try {
      const [definitions, userStats, achievements, userAchievements, emblemCount] = await Promise.all([
        models.StatDefinitions.findAll({ where: { isActive: true }, order: [['id', 'ASC']] }),
        models.UserStats.findAll({ where: { userId: req.user.id }, include: [{ model: models.StatDefinitions, as: 'statDefinition', required: true }] }),
        models.Achievements.findAll({ where: { isActive: true }, attributes: ['id'] }),
        models.UserAchievements.findAll({ where: { userId: req.user.id, isReached: true }, attributes: ['achievementId'] }),
        models.user_emblems.count({ where: { userId: req.user.id } }),
      ]);
      const values = new Map(userStats.map((item) => [item.statDefinitionId, item.value]));
      const [connectedAccounts, achievedEmblems, successfulLogins] = await Promise.all([
        models.user_connected_accounts.count({ where: { userId: req.user.id } }),
        models.user_emblems.count({ where: { userId: req.user.id } }),
        models.Attempts.count({ where: { user: req.user.id, status: 'SUCCESS', action_type: { [Op.in]: ['LOGIN', 'GOOGLE_LOGIN', 'TWITCH_LOGIN'] } } }),
      ]);
      const sourceValues = new Map([
        ['CONNECTED_ACCOUNTS', connectedAccounts],
        ['EMBLEMS_ACHIEVED', achievedEmblems],
        ['LOGIN_COUNT', successfulLogins],
      ]);
      const stats = definitions.map((definition) => ({ id: definition.id, key: definition.key, name: definition.name, description: definition.description, dataType: definition.dataType, aggregation: definition.aggregation, value: sourceValues.has(definition.key) ? sourceValues.get(definition.key) : toNumber(values.get(definition.id)) }));
      const totalAchievements = achievements.length;
      const achievedAchievements = userAchievements.length;
      const achievementCompletion = totalAchievements
        ? Math.round((achievedAchievements / totalAchievements) * 100)
        : 0;
      await req.logAction({ accion: 'Estadísticas del usuario consultadas', apartado: 'Achievements', userId: req.user.id, username: req.user.username, valor: `count=${stats.length}`, type: 'info' });
      return res.json({
        stats,
        summary: {
          achievedAchievements,
          totalAchievements,
          achievementCompletion,
          emblemsAchieved: emblemCount,
        },
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al consultar estadísticas del usuario');
    }
  };
}

const ctrlAchievementProgress = new AchievementProgressController();
export { ctrlAchievementProgress };
