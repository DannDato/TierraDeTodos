import handleError from '../../handlers/handleError.js';
import { models } from '../../models/index.js';

const normalizeUserEmblem = (row) => ({
  id: row.id,
  userId: row.userId,
  emblemId: row.emblemId,
  editionId: row.editionId,
  sourceGoalId: row.sourceGoalId,
  earnedAt: row.earnedAt,
  isEquipped: Boolean(row.isEquipped),
  order: Number(row.order) || 0,
  emblem: row.emblem ? {
    id: row.emblem.id,
    name: row.emblem.name,
    description: row.emblem.description,
    iconUrl: row.emblem.iconUrl,
    color: row.emblem.color,
    rarity: row.emblem.rarity,
    isHidden: Boolean(row.emblem.isHidden),
    isActive: Boolean(row.emblem.isActive)
  } : null,
  edition: row.edition ? {
    id: row.edition.id,
    name: row.edition.name,
    number: row.edition.number,
    status: row.edition.status
  } : null
});

const normalizeUserGoal = (row) => ({
  id: row.id,
  userId: row.userId,
  goalId: row.goalId,
  editionId: row.editionId,
  progress: Number(row.progress) || 0,
  isCompleted: Boolean(row.isCompleted),
  completedAt: row.completedAt,
  goal: row.goal ? {
    id: row.goal.id,
    emblemId: row.goal.emblemId,
    title: row.goal.title,
    description: row.goal.description,
    type: row.goal.type,
    targetValue: Number(row.goal.targetValue) || 0,
    progressType: row.goal.progressType,
    isHidden: Boolean(row.goal.isHidden),
    isRepeatable: Boolean(row.goal.isRepeatable),
    emblem: row.goal.emblem ? {
      id: row.goal.emblem.id,
      name: row.goal.emblem.name,
      iconUrl: row.goal.emblem.iconUrl,
      color: row.goal.emblem.color,
      rarity: row.goal.emblem.rarity,
    } : null,
  } : null,
  edition: row.edition ? {
    id: row.edition.id,
    name: row.edition.name,
    number: row.edition.number,
    status: row.edition.status
  } : null
});

class ProgressController {
  getMyEmblems = async (req, res) => {
    try {
      const userId = req.user?.id;

      const [emblemRows, goalRows] = await Promise.all([
        models.user_emblems.findAll({
          where: { userId },
          include: [
            {
              model: models.emblems,
              as: 'emblem',
              attributes: ['id', 'name', 'description', 'iconUrl', 'color', 'rarity', 'isHidden', 'isActive']
            },
            {
              model: models.Edition,
              as: 'edition',
              attributes: ['id', 'name', 'number', 'status']
            }
          ],
          order: [['isEquipped', 'DESC'], ['order', 'ASC'], ['earnedAt', 'DESC'], ['id', 'ASC']]
        }),
        models.user_goals.findAll({
          where: { userId },
          include: [
            {
              model: models.goals,
              as: 'goal',
              attributes: ['id', 'emblemId', 'title', 'description', 'type', 'targetValue', 'progressType', 'isHidden', 'isRepeatable'],
              include: [
                {
                  model: models.emblems,
                  as: 'emblem',
                  attributes: ['id', 'name', 'iconUrl', 'color', 'rarity']
                }
              ]
            },
            {
              model: models.Edition,
              as: 'edition',
              attributes: ['id', 'name', 'number', 'status']
            }
          ],
          order: [['isCompleted', 'DESC'], ['completedAt', 'DESC'], ['updatedAt', 'DESC'], ['id', 'ASC']]
        })
      ]);

      const userEmblems = emblemRows.map(normalizeUserEmblem);
      const userGoals = goalRows.map(normalizeUserGoal);
      const totalEmblems = userEmblems.length;
      const equippedCount = userEmblems.filter((item) => item.isEquipped).length;
      const completedGoalsCount = userGoals.filter((item) => item.isCompleted).length;
      const inProgressGoalsCount = userGoals.filter((item) => !item.isCompleted && item.progress > 0).length;
      const totalGoalProgress = userGoals.reduce((sum, item) => sum + (Number(item.progress) || 0), 0);
      const averageGoalCompletion = userGoals.length
        ? Math.round((userGoals.reduce((sum, item) => {
            const targetValue = Math.max(Number(item.goal?.targetValue) || 0, 1);
            const normalizedProgress = item.isCompleted ? 1 : Math.min((Number(item.progress) || 0) / targetValue, 1);
            return sum + normalizedProgress;
          }, 0) / userGoals.length) * 100)
        : 0;

      return res.status(200).json({
        userEmblems,
        allEmblems: userEmblems.filter((item) => !item.isEquipped),
        equippedEmblems: userEmblems.filter((item) => item.isEquipped),
        userGoals,
        stats: {
          totalEmblems,
          equippedEmblems: equippedCount,
          unequippedEmblems: Math.max(totalEmblems - equippedCount, 0),
          totalGoals: userGoals.length,
          completedGoals: completedGoalsCount,
          inProgressGoals: inProgressGoalsCount,
          totalGoalProgress,
          averageGoalCompletion,
        }
      });
    } catch (error) {
      handleError(res, req, error, 'Error al cargar emblemas del progreso del usuario');
    }
  };

  saveMyEmblemsLayout = async (req, res) => {
    const transaction = await models.user_emblems.sequelize.transaction();

    try {
      const userId = req.user?.id;
      const equippedIds = Array.isArray(req.body?.equippedIds) ? req.body.equippedIds : null;
      const availableIds = Array.isArray(req.body?.availableIds) ? req.body.availableIds : null;

      if (!equippedIds || !availableIds) {
        await transaction.rollback();
        return res.status(400).json({ message: 'equippedIds y availableIds son obligatorios' });
      }

      const normalizeIds = (values) => values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);

      const nextEquippedIds = normalizeIds(equippedIds);
      const nextAvailableIds = normalizeIds(availableIds);
      const nextCombinedIds = [...nextEquippedIds, ...nextAvailableIds];
      const nextIdSet = new Set(nextCombinedIds);

      if (nextIdSet.size !== nextCombinedIds.length) {
        await transaction.rollback();
        return res.status(400).json({ message: 'No se permiten insignias repetidas en la organización' });
      }

      const currentRows = await models.user_emblems.findAll({
        where: { userId },
        transaction
      });

      const currentIds = currentRows.map((row) => row.id);
      const currentIdSet = new Set(currentIds);

      if (currentIds.length !== nextCombinedIds.length || currentIds.some((id) => !nextIdSet.has(id))) {
        await transaction.rollback();
        return res.status(400).json({ message: 'La organización enviada no coincide con las insignias del usuario' });
      }

      const rowById = new Map(currentRows.map((row) => [row.id, row]));

      await Promise.all(nextEquippedIds.map((id, index) => {
        const row = rowById.get(id);
        row.isEquipped = true;
        row.order = index;
        return row.save({ transaction });
      }));

      await Promise.all(nextAvailableIds.map((id, index) => {
        const row = rowById.get(id);
        row.isEquipped = false;
        row.order = index;
        return row.save({ transaction });
      }));

      await transaction.commit();

      return res.status(200).json({ message: 'Organización de insignias actualizada correctamente' });
    } catch (error) {
      await transaction.rollback();
      handleError(res, req, error, 'Error al guardar organización de insignias del usuario');
    }
  };
}

const ctrlProgress = new ProgressController();
export { ctrlProgress };