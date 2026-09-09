import { UniqueConstraintError } from 'sequelize';
import { db, models } from '../models/index.js';
import emblemReach from './AchieveEmblem.js';
import { NotifyUser } from './notifications.js';

const isUniqueError = (error) => error instanceof UniqueConstraintError || error?.name === 'SequelizeUniqueConstraintError';
const toNumber = (value) => Number(value || 0);

const logEngine = async (req, action, userId, value, type = 'info') => {
  if (!req?.logAction) return;
  try {
    await req.logAction({ accion: action, apartado: 'Achievements', userId, valor: value, type });
  } catch {
    // La auditoría no debe romper una acción principal.
  }
};

const getActiveStat = async (statKey, transaction) => {
  const stat = await models.StatDefinitions.findOne({ where: { key: statKey, isActive: true }, transaction });
  if (!stat) throw new Error(`Estadística activa no encontrada: ${statKey}`);
  return stat;
};

const getOrCreateUserStat = async (userId, statDefinitionId, initialValue, transaction) => {
  let row = await models.UserStats.findOne({ where: { userId, statDefinitionId }, transaction, lock: transaction.LOCK.UPDATE });
  if (row) return { row, created: false };
  try {
    return { row: await models.UserStats.create({ userId, statDefinitionId, value: initialValue }, { transaction }), created: true };
  } catch (error) {
    if (!isUniqueError(error)) throw error;
    row = await models.UserStats.findOne({ where: { userId, statDefinitionId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw error;
    return { row, created: false };
  }
};

const evaluateAchievement = (achievement, value) => {
  const goal = toNumber(achievement.goal);
  const current = toNumber(value);
  if (achievement.operator === 'LTE') return current <= goal;
  if (achievement.operator === 'EQ') return current === goal;
  return current >= goal;
};

const getOrCreateUserAchievement = async (userId, achievementId, transaction) => {
  let row = await models.UserAchievements.findOne({ where: { userId, achievementId }, transaction, lock: transaction.LOCK.UPDATE });
  if (row) return row;
  try {
    return await models.UserAchievements.create({ userId, achievementId, progress: 0 }, { transaction });
  } catch (error) {
    if (!isUniqueError(error)) throw error;
    row = await models.UserAchievements.findOne({ where: { userId, achievementId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw error;
    return row;
  }
};

const deliverPrizes = async (unlocked, userId, req) => {
  for (const achievement of unlocked) {
    if (!achievement.prizeEmblemId) continue;
    try {
      await emblemReach(userId, achievement.prizeEmblemId, req, { notify: false });
    } catch (error) {
      await logEngine(req, 'No se pudo entregar el emblema de un achievement', userId, `achievement=${achievement.key}; emblemId=${achievement.prizeEmblemId}; error=${error.message}`, 'error');
    }
  }
};

const deliverAchievementNotifications = async (unlocked, userId, req) => {
  for (const achievement of unlocked) {
    try {
      await NotifyUser(userId, {
        key: `ACHIEVEMENT_REACHED:${userId}:${achievement.id}`,
        type: 'ACHIEVEMENT',
        category: 'achievements',
        title: '¡Logro desbloqueado!',
        message: achievement.name,
        priority: 'NORMAL',
        entityType: 'ACHIEVEMENT',
        entityId: achievement.id,
        actionTarget: '/progress',
        icon: achievement.icon || 'Award',
        metadata: { rarity: achievement.rarity, achievementKey: achievement.key },
      }, req);
    } catch (notificationError) {
      await logEngine(req, 'No se pudo crear notificación de achievement', userId, `achievement=${achievement.key}; error=${notificationError.message}`, 'error');
    }
  }
};

export const checkAchievements = async (userId, statKey, req, suppliedTransaction = null) => {
  const ownsTransaction = !suppliedTransaction;
  const transaction = suppliedTransaction || await db.transaction();
  try {
    const stat = await getActiveStat(statKey, transaction);
    const userStat = await models.UserStats.findOne({ where: { userId, statDefinitionId: stat.id }, transaction, lock: transaction.LOCK.UPDATE });
    const currentValue = toNumber(userStat?.value);
    const achievements = await models.Achievements.findAll({
      where: { statDefinitionId: stat.id, type: 'STAT', isActive: true },
      transaction,
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
    });
    const unlocked = [];
    for (const achievement of achievements) {
      const progress = await getOrCreateUserAchievement(userId, achievement.id, transaction);
      const wasReached = Boolean(progress.isReached);
      const reached = wasReached || evaluateAchievement(achievement, currentValue);
      await progress.update({ progress: currentValue, isReached: reached, reachedAt: progress.reachedAt || (reached ? new Date() : null) }, { transaction });
      if (!wasReached && reached) unlocked.push(achievement.get({ plain: true }));
    }
    if (ownsTransaction) await transaction.commit();
    if (ownsTransaction) await deliverPrizes(unlocked, userId, req);
    if (ownsTransaction) await deliverAchievementNotifications(unlocked, userId, req);
    if (unlocked.length) await logEngine(req, 'Achievements desbloqueados', userId, unlocked.map((item) => item.key).join(','));
    return { value: currentValue, statKey, unlocked };
  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    throw error;
  }
};

export const incrementStat = async (userId, statKey, amount = 1, req) => {
  if (amount && typeof amount === 'object' && !req) {
    req = amount;
    amount = 1;
  }
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount)) throw new Error('Cantidad inválida para estadística');
  const transaction = await db.transaction();
  try {
    const stat = await getActiveStat(statKey, transaction);
    if (stat.aggregation !== 'INCREMENT') throw new Error(`La estadística ${statKey} no acepta incrementos`);
      const statRow = await getOrCreateUserStat(userId, stat.id, normalizedAmount, transaction);
      const row = statRow.row;
      if (!statRow.created) {
        await row.update({ value: toNumber(row.value) + normalizedAmount }, { transaction });
    }
    const result = await checkAchievements(userId, statKey, req, transaction);
    await transaction.commit();
    await deliverPrizes(result.unlocked, userId, req);
    return { ...result, value: toNumber(row.value) };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const setStat = async (userId, statKey, value, req) => {
  const normalizedValue = Number(value);
  if (!Number.isFinite(normalizedValue)) throw new Error('Valor inválido para estadística');
  const transaction = await db.transaction();
  try {
    const stat = await getActiveStat(statKey, transaction);
    if (stat.aggregation !== 'SET') throw new Error(`La estadística ${statKey} no acepta reemplazos`);
    const statRow = await getOrCreateUserStat(userId, stat.id, normalizedValue, transaction);
    const row = statRow.row;
    await row.update({ value: normalizedValue }, { transaction });
    const result = await checkAchievements(userId, statKey, req, transaction);
    await transaction.commit();
    await deliverPrizes(result.unlocked, userId, req);
    return { ...result, value: normalizedValue };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const reachAchievement = async (userId, achievementKey, req) => {
  const transaction = await db.transaction();
  try {
    const achievement = await models.Achievements.findOne({ where: { key: achievementKey, isActive: true }, transaction });
    if (!achievement) throw new Error(`Achievement activo no encontrado: ${achievementKey}`);
    if (achievement.type !== 'CUSTOM') throw new Error(`El achievement ${achievementKey} no es CUSTOM`);
    const progress = await getOrCreateUserAchievement(userId, achievement.id, transaction);
    const achieved = !progress.isReached;
    await progress.update({ progress: 1, isReached: true, reachedAt: progress.reachedAt || new Date() }, { transaction });
    await transaction.commit();
    if (achieved) await deliverPrizes([achievement.get({ plain: true })], userId, req);
    if (achieved) await deliverAchievementNotifications([achievement.get({ plain: true })], userId, req);
    if (achieved) await logEngine(req, 'Achievement CUSTOM desbloqueado', userId, `achievement=${achievementKey}`);
    return { achieved, achievement, userAchievement: progress };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default { incrementStat, setStat, checkAchievements, reachAchievement };
