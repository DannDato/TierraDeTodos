import { Op } from 'sequelize';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

const EMBLEM_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'];
const GOAL_TYPES = ['kill', 'craft', 'explore', 'social', 'event', 'custom'];
const GOAL_PROGRESS_TYPES = ['cumulative', 'single', 'boolean'];

const normalizeText = (value) => String(value || '').trim();
const normalizeNullableText = (value) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseBooleanOrDefault = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'si'].includes(normalized);
};

const createS3Client = () => new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const getPublicBases = () => {
  const bases = [];

  if (process.env.R2_PUBLIC_URL) {
    bases.push(process.env.R2_PUBLIC_URL.replace(/\/$/, ''));
  }

  if (process.env.R2_ENDPOINT && process.env.R2_BUCKET) {
    bases.push(`${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`.replace(/\/$/, ''));
  }

  return [...new Set(bases)];
};

const extractR2KeyFromUrl = (fileUrl) => {
  const rawUrl = String(fileUrl || '').trim();
  if (!rawUrl) return null;

  const publicBases = getPublicBases();
  const matchedBase = publicBases.find((base) => rawUrl.startsWith(base));
  if (matchedBase) {
    const key = rawUrl.slice(matchedBase.length + 1);
    return key || null;
  }

  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname.replace(/^\//, '') || null;
  } catch {
    return null;
  }
};

const deleteR2ObjectByUrl = async (fileUrl) => {
  const key = extractR2KeyFromUrl(fileUrl);
  if (!key) return false;

  await createS3Client().send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  }));

  return true;
};

class AchievementsController {
  uploadEmblemIcon = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se subiÃ³ ningÃºn archivo.' });
      }

      const userId = req.user?.id || 'unknown';
      const extByMime = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };
      const extension = extByMime[req.file.mimetype] || 'webp';
      const folder = process.env.R2_FOLDER || 'tdt-system';
      const key = `${folder}/achievements/emblems/${userId}/icon_${Date.now()}.${extension}`;

      await createS3Client().send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));

      const url = (process.env.R2_PUBLIC_URL
        ? process.env.R2_PUBLIC_URL.replace(/\/$/, '')
        : `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`.replace(/\/$/, '')) + `/${key}`;

      await req.logAction({
        accion: 'Icono de emblema subido',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `key=${key}`,
        type: 'info'
      });

      return res.status(201).json({ url });
    } catch (error) {
      handleError(res, req, error, 'Error al subir icono de emblema');
    }
  };

  getAssignableUsers = async (req, res) => {
    try {
      const q = normalizeText(req.query?.q).toLowerCase();

      const where = {};
      if (q) {
        where[Op.or] = [
          { username: { [Op.like]: `%${q}%` } },
          { displayName: { [Op.like]: `%${q}%` } },
          { folio: { [Op.like]: `%${q}%` } }
        ];
      }

      const users = await models.Users.findAll({
        where,
        attributes: ['id', 'username', 'displayName', 'folio', 'role', 'account'],
        order: [['username', 'ASC'], ['id', 'ASC']]
      });

      await req.logAction({
        accion: 'Usuarios asignables para emblemas consultados',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `users=${users.length}; q=${q}`,
        type: 'info'
      });

      return res.status(200).json({ users });
    } catch (error) {
      handleError(res, req, error, 'Error al cargar usuarios para asignaciÃ³n de emblemas');
    }
  };

  getUserEmblems = async (req, res) => {
    try {
      const userId = parseNumber(req.query?.userId);
      const editionId = parseNumber(req.query?.editionId);

      const where = {};
      if (userId) where.userId = userId;
      if (editionId) where.editionId = editionId;

      const userEmblems = await models.user_emblems.findAll({
        where,
        include: [
          {
            model: models.Users,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'folio']
          },
          {
            model: models.emblems,
            as: 'emblem',
            attributes: ['id', 'name', 'rarity', 'color']
          },
          {
            model: models.Edition,
            as: 'edition',
            attributes: ['id', 'name', 'number', 'status']
          },
          {
            model: models.goals,
            as: 'source_goal',
            attributes: ['id', 'title', 'type'],
            required: false
          }
        ],
        order: [['userId', 'ASC'], ['editionId', 'DESC'], ['order', 'ASC'], ['earnedAt', 'DESC']]
      });

      await req.logAction({
        accion: 'Emblemas de usuarios consultados',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `userEmblems=${userEmblems.length}`,
        type: 'info'
      });

      return res.status(200).json({ userEmblems });
    } catch (error) {
      handleError(res, req, error, 'Error al cargar emblemas asignados a usuarios');
    }
  };

  createUserEmblem = async (req, res) => {
    try {
      const userId = parseNumber(req.body?.userId);
      const emblemId = parseNumber(req.body?.emblemId);
      const editionId = parseNumber(req.body?.editionId);
      const sourceGoalId = parseNumber(req.body?.sourceGoalId);
      const isEquipped = parseBooleanOrDefault(req.body?.isEquipped, false);
      const earnedAt = parseDate(req.body?.earnedAt) || new Date();

      let order = Number(req.body?.order);
      if (!Number.isInteger(order) || order < 0) {
        const maxOrder = await models.user_emblems.max('order', {
          where: { userId, editionId }
        });
        order = Number.isFinite(Number(maxOrder)) ? Number(maxOrder) + 1 : 0;
      }

      if (!userId || !emblemId || !editionId) {
        return res.status(400).json({ message: 'userId, emblemId y editionId son obligatorios' });
      }

      const [user, emblem, edition] = await Promise.all([
        models.Users.findByPk(userId),
        models.emblems.findByPk(emblemId),
        models.Edition.findByPk(editionId)
      ]);

      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      if (!emblem) return res.status(404).json({ message: 'Emblema no encontrado' });
      if (!edition) return res.status(404).json({ message: 'EdiciÃ³n no encontrada' });

      if (emblem.editionId !== editionId) {
        return res.status(400).json({ message: 'El emblema debe pertenecer a la misma ediciÃ³n' });
      }

      if (sourceGoalId) {
        const goal = await models.goals.findByPk(sourceGoalId);
        if (!goal) return res.status(404).json({ message: 'Logro fuente no encontrado' });
        if (goal.editionId !== editionId || goal.emblemId !== emblemId) {
          return res.status(400).json({ message: 'El logro fuente debe pertenecer a la misma ediciÃ³n y emblema' });
        }
      }

      const duplicate = await models.user_emblems.findOne({ where: { userId, emblemId } });
      if (duplicate) {
        return res.status(409).json({ message: 'El usuario ya tiene asignado este emblema' });
      }

      const created = await models.user_emblems.create({
        userId,
        emblemId,
        editionId,
        earnedAt,
        sourceGoalId: sourceGoalId || null,
        isEquipped,
        order
      });

      await req.logAction({
        accion: 'Emblema asignado a usuario',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `assignmentId=${created.id}; targetUserId=${userId}; emblemId=${emblemId}`,
        type: 'info'
      });

      return res.status(201).json(created);
    } catch (error) {
      handleError(res, req, error, 'Error al asignar emblema al usuario');
    }
  };

  updateUserEmblem = async (req, res) => {
    try {
      const id = parseNumber(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const row = await models.user_emblems.findByPk(id);
      if (!row) return res.status(404).json({ message: 'AsignaciÃ³n de emblema no encontrada' });

      const nextSourceGoalId = req.body?.sourceGoalId === null || req.body?.sourceGoalId === ''
        ? null
        : (parseNumber(req.body?.sourceGoalId) || row.sourceGoalId);

      const nextIsEquipped = req.body?.isEquipped !== undefined
        ? parseBooleanOrDefault(req.body?.isEquipped)
        : row.isEquipped;

      const nextOrderCandidate = Number(req.body?.order);
      const nextOrder = Number.isInteger(nextOrderCandidate) && nextOrderCandidate >= 0
        ? nextOrderCandidate
        : row.order;

      if (nextSourceGoalId) {
        const goal = await models.goals.findByPk(nextSourceGoalId);
        if (!goal) return res.status(404).json({ message: 'Logro fuente no encontrado' });
        if (goal.editionId !== row.editionId || goal.emblemId !== row.emblemId) {
          return res.status(400).json({ message: 'El logro fuente debe corresponder al mismo emblema y ediciÃ³n' });
        }
      }

      row.sourceGoalId = nextSourceGoalId;
      row.isEquipped = nextIsEquipped;
      row.order = nextOrder;
      await row.save();

      await req.logAction({
        accion: 'Asignacion de emblema actualizada',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `assignmentId=${row.id}; equipped=${nextIsEquipped}; order=${nextOrder}`,
        type: 'info'
      });

      return res.status(200).json(row);
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar asignaciÃ³n de emblema');
    }
  };

  deleteUserEmblem = async (req, res) => {
    try {
      const id = parseNumber(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const row = await models.user_emblems.findByPk(id);
      if (!row) return res.status(404).json({ message: 'AsignaciÃ³n de emblema no encontrada' });

      await row.destroy();
      await req.logAction({
        accion: 'Asignacion de emblema eliminada',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `assignmentId=${id}`,
        type: 'info'
      });
      return res.status(200).json({ message: 'AsignaciÃ³n eliminada correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar asignaciÃ³n de emblema');
    }
  };

  getEmblems = async (req, res) => {
    try {
      const editionId = parseNumber(req.query?.editionId);

      const where = {};
      if (editionId) where.editionId = editionId;

      const emblems = await models.emblems.findAll({
        where,
        include: [
          {
            model: models.Edition,
            as: 'edition',
            attributes: ['id', 'name', 'number', 'status']
          },
          {
            model: models.goals,
            as: 'goals',
            attributes: ['id', 'title', 'type', 'targetValue', 'isHidden'],
            required: false
          }
        ],
        order: [['editionId', 'DESC'], ['createdAt', 'DESC'], ['id', 'DESC']]
      });

      await req.logAction({
        accion: 'Emblemas consultados',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `emblems=${emblems.length}`,
        type: 'info'
      });

      return res.status(200).json({ emblems });
    } catch (error) {
      handleError(res, req, error, 'Error al cargar emblemas');
    }
  };

  createEmblem = async (req, res) => {
    try {
      const editionId = parseNumber(req.body?.editionId);
      const name = normalizeText(req.body?.name);
      const description = normalizeText(req.body?.description);
      const iconUrl = normalizeNullableText(req.body?.iconUrl);
      const rarity = normalizeText(req.body?.rarity || 'common').toLowerCase();
      const color = normalizeText(req.body?.color || '#9CA3AF');
      const isHidden = parseBooleanOrDefault(req.body?.isHidden, false);
      const isActive = parseBooleanOrDefault(req.body?.isActive, true);

      if (!editionId || !name || !description) {
        return res.status(400).json({ message: 'editionId, name y description son obligatorios' });
      }

      if (!EMBLEM_RARITIES.includes(rarity)) {
        return res.status(400).json({ message: 'rarity invÃ¡lida' });
      }

      const edition = await models.Edition.findByPk(editionId);
      if (!edition) {
        return res.status(404).json({ message: 'EdiciÃ³n no encontrada' });
      }

      const duplicated = await models.emblems.findOne({ where: { editionId, name } });
      if (duplicated) {
        return res.status(409).json({ message: 'Ya existe un emblema con ese nombre en la ediciÃ³n seleccionada' });
      }

      const created = await models.emblems.create({
        editionId,
        name,
        description,
        iconUrl,
        rarity,
        color,
        isHidden,
        isActive
      });

      await req.logAction({
        accion: 'Emblema creado',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `emblemId=${created.id}; editionId=${editionId}; name=${name}`,
        type: 'info'
      });

      return res.status(201).json(created);
    } catch (error) {
      handleError(res, req, error, 'Error al crear emblema');
    }
  };

  updateEmblem = async (req, res) => {
    try {
      const emblemId = parseNumber(req.params.id);
      if (!emblemId) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const emblem = await models.emblems.findByPk(emblemId);
      if (!emblem) return res.status(404).json({ message: 'Emblema no encontrado' });

      const nextEditionId = parseNumber(req.body?.editionId) || emblem.editionId;
      const nextName = normalizeText(req.body?.name ?? emblem.name);
      const nextDescription = normalizeText(req.body?.description ?? emblem.description);
      const nextIconUrl = req.body?.iconUrl !== undefined
        ? normalizeNullableText(req.body?.iconUrl)
        : emblem.iconUrl;
      const nextRarity = normalizeText(req.body?.rarity ?? emblem.rarity).toLowerCase();
      const nextColor = normalizeText(req.body?.color ?? emblem.color);
      const nextIsHidden = req.body?.isHidden !== undefined
        ? parseBooleanOrDefault(req.body?.isHidden)
        : emblem.isHidden;
      const nextIsActive = req.body?.isActive !== undefined
        ? parseBooleanOrDefault(req.body?.isActive)
        : emblem.isActive;

      if (!nextEditionId || !nextName || !nextDescription) {
        return res.status(400).json({ message: 'editionId, name y description son obligatorios' });
      }

      if (!EMBLEM_RARITIES.includes(nextRarity)) {
        return res.status(400).json({ message: 'rarity invÃ¡lida' });
      }

      const edition = await models.Edition.findByPk(nextEditionId);
      if (!edition) {
        return res.status(404).json({ message: 'EdiciÃ³n no encontrada' });
      }

      const duplicated = await models.emblems.findOne({ where: { editionId: nextEditionId, name: nextName } });
      if (duplicated && duplicated.id !== emblem.id) {
        return res.status(409).json({ message: 'Ya existe un emblema con ese nombre en la ediciÃ³n seleccionada' });
      }

      emblem.editionId = nextEditionId;
      emblem.name = nextName;
      emblem.description = nextDescription;

      if (emblem.iconUrl && emblem.iconUrl !== nextIconUrl) {
        try {
          await deleteR2ObjectByUrl(emblem.iconUrl);
        } catch (cleanupError) {
          console.warn(`No se pudo borrar icono anterior del emblema ${emblem.id}: ${cleanupError.message}`);
        }
      }

      emblem.iconUrl = nextIconUrl;
      emblem.rarity = nextRarity;
      emblem.color = nextColor;
      emblem.isHidden = nextIsHidden;
      emblem.isActive = nextIsActive;
      await emblem.save();

      await req.logAction({
        accion: 'Emblema actualizado',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `emblemId=${emblem.id}; editionId=${nextEditionId}; name=${nextName}`,
        type: 'info'
      });

      return res.status(200).json(emblem);
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar emblema');
    }
  };

  deleteEmblem = async (req, res) => {
    try {
      const emblemId = parseNumber(req.params.id);
      if (!emblemId) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const emblem = await models.emblems.findByPk(emblemId);
      if (!emblem) return res.status(404).json({ message: 'Emblema no encontrado' });

      const [linkedGoals, linkedUsers] = await Promise.all([
        models.goals.count({ where: { emblemId } }),
        models.user_emblems.count({ where: { emblemId } })
      ]);

      if (linkedGoals > 0 || linkedUsers > 0) {
        return res.status(409).json({
          message: 'No se puede eliminar el emblema porque estÃ¡ ligado a logros o usuarios',
          linkedGoals,
          linkedUsers
        });
      }

      if (emblem.iconUrl) {
        try {
          await deleteR2ObjectByUrl(emblem.iconUrl);
        } catch (cleanupError) {
          console.warn(`No se pudo borrar icono del emblema ${emblem.id}: ${cleanupError.message}`);
        }
      }

      await emblem.destroy();
      await req.logAction({
        accion: 'Emblema eliminado',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `emblemId=${emblem.id}; name=${emblem.name}`,
        type: 'info'
      });
      return res.status(200).json({ message: 'Emblema eliminado correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar emblema');
    }
  };

  getGoals = async (req, res) => {
    try {
      const editionId = parseNumber(req.query?.editionId);
      const emblemId = parseNumber(req.query?.emblemId);

      const where = {};
      if (editionId) where.editionId = editionId;
      if (emblemId) where.emblemId = emblemId;

      const goals = await models.goals.findAll({
        where,
        include: [
          {
            model: models.Edition,
            as: 'edition',
            attributes: ['id', 'name', 'number', 'status']
          },
          {
            model: models.emblems,
            as: 'emblem',
            attributes: ['id', 'name', 'rarity', 'color', 'isHidden']
          }
        ],
        order: [['editionId', 'DESC'], ['createdAt', 'DESC'], ['id', 'DESC']]
      });

      await req.logAction({
        accion: 'Logros consultados',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `goals=${goals.length}`,
        type: 'info'
      });

      return res.status(200).json({ goals });
    } catch (error) {
      handleError(res, req, error, 'Error al cargar logros');
    }
  };

  createGoal = async (req, res) => {
    try {
      const editionId = parseNumber(req.body?.editionId);
      const emblemId = parseNumber(req.body?.emblemId);
      const title = normalizeText(req.body?.title);
      const description = normalizeText(req.body?.description);
      const type = normalizeText(req.body?.type || 'custom').toLowerCase();
      const targetValue = Number(req.body?.targetValue ?? 1);
      const progressType = normalizeText(req.body?.progressType || 'cumulative').toLowerCase();
      const isHidden = parseBooleanOrDefault(req.body?.isHidden, false);
      const isRepeatable = parseBooleanOrDefault(req.body?.isRepeatable, false);
      const startDate = parseDate(req.body?.startDate);
      const endDate = parseDate(req.body?.endDate);

      if (!editionId || !emblemId || !title || !description) {
        return res.status(400).json({ message: 'editionId, emblemId, title y description son obligatorios' });
      }

      if (!GOAL_TYPES.includes(type)) {
        return res.status(400).json({ message: 'type invÃ¡lido' });
      }

      if (!GOAL_PROGRESS_TYPES.includes(progressType)) {
        return res.status(400).json({ message: 'progressType invÃ¡lido' });
      }

      if (!Number.isFinite(targetValue) || targetValue < 0) {
        return res.status(400).json({ message: 'targetValue invÃ¡lido' });
      }

      if (req.body?.startDate && !startDate) {
        return res.status(400).json({ message: 'startDate invÃ¡lida' });
      }

      if (req.body?.endDate && !endDate) {
        return res.status(400).json({ message: 'endDate invÃ¡lida' });
      }

      if (startDate && endDate && endDate < startDate) {
        return res.status(400).json({ message: 'endDate no puede ser menor que startDate' });
      }

      const [edition, emblem] = await Promise.all([
        models.Edition.findByPk(editionId),
        models.emblems.findByPk(emblemId)
      ]);

      if (!edition) return res.status(404).json({ message: 'EdiciÃ³n no encontrada' });
      if (!emblem) return res.status(404).json({ message: 'Emblema no encontrado' });

      if (emblem.editionId !== editionId) {
        return res.status(400).json({ message: 'El emblema debe pertenecer a la misma ediciÃ³n del logro' });
      }

      const duplicated = await models.goals.findOne({ where: { editionId, title } });
      if (duplicated) {
        return res.status(409).json({ message: 'Ya existe un logro con ese tÃ­tulo en la ediciÃ³n seleccionada' });
      }

      const created = await models.goals.create({
        editionId,
        emblemId,
        title,
        description,
        type,
        targetValue,
        progressType,
        isHidden,
        isRepeatable,
        startDate,
        endDate
      });

      await req.logAction({
        accion: 'Logro creado',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `goalId=${created.id}; editionId=${editionId}; emblemId=${emblemId}`,
        type: 'info'
      });

      return res.status(201).json(created);
    } catch (error) {
      handleError(res, req, error, 'Error al crear logro');
    }
  };

  updateGoal = async (req, res) => {
    try {
      const goalId = parseNumber(req.params.id);
      if (!goalId) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const goal = await models.goals.findByPk(goalId);
      if (!goal) return res.status(404).json({ message: 'Logro no encontrado' });

      const nextEditionId = parseNumber(req.body?.editionId) || goal.editionId;
      const nextEmblemId = parseNumber(req.body?.emblemId) || goal.emblemId;
      const nextTitle = normalizeText(req.body?.title ?? goal.title);
      const nextDescription = normalizeText(req.body?.description ?? goal.description);
      const nextType = normalizeText(req.body?.type ?? goal.type).toLowerCase();
      const nextTargetValue = Number(req.body?.targetValue ?? goal.targetValue);
      const nextProgressType = normalizeText(req.body?.progressType ?? goal.progressType).toLowerCase();
      const nextIsHidden = req.body?.isHidden !== undefined
        ? parseBooleanOrDefault(req.body?.isHidden)
        : goal.isHidden;
      const nextIsRepeatable = req.body?.isRepeatable !== undefined
        ? parseBooleanOrDefault(req.body?.isRepeatable)
        : goal.isRepeatable;

      const nextStartDate = req.body?.startDate !== undefined
        ? parseDate(req.body?.startDate)
        : goal.startDate;
      const nextEndDate = req.body?.endDate !== undefined
        ? parseDate(req.body?.endDate)
        : goal.endDate;

      if (!nextEditionId || !nextEmblemId || !nextTitle || !nextDescription) {
        return res.status(400).json({ message: 'editionId, emblemId, title y description son obligatorios' });
      }

      if (!GOAL_TYPES.includes(nextType)) {
        return res.status(400).json({ message: 'type invÃ¡lido' });
      }

      if (!GOAL_PROGRESS_TYPES.includes(nextProgressType)) {
        return res.status(400).json({ message: 'progressType invÃ¡lido' });
      }

      if (!Number.isFinite(nextTargetValue) || nextTargetValue < 0) {
        return res.status(400).json({ message: 'targetValue invÃ¡lido' });
      }

      if (req.body?.startDate !== undefined && req.body?.startDate !== null && req.body?.startDate !== '' && !nextStartDate) {
        return res.status(400).json({ message: 'startDate invÃ¡lida' });
      }

      if (req.body?.endDate !== undefined && req.body?.endDate !== null && req.body?.endDate !== '' && !nextEndDate) {
        return res.status(400).json({ message: 'endDate invÃ¡lida' });
      }

      if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
        return res.status(400).json({ message: 'endDate no puede ser menor que startDate' });
      }

      const [edition, emblem] = await Promise.all([
        models.Edition.findByPk(nextEditionId),
        models.emblems.findByPk(nextEmblemId)
      ]);

      if (!edition) return res.status(404).json({ message: 'EdiciÃ³n no encontrada' });
      if (!emblem) return res.status(404).json({ message: 'Emblema no encontrado' });

      if (emblem.editionId !== nextEditionId) {
        return res.status(400).json({ message: 'El emblema debe pertenecer a la misma ediciÃ³n del logro' });
      }

      const duplicated = await models.goals.findOne({ where: { editionId: nextEditionId, title: nextTitle } });
      if (duplicated && duplicated.id !== goal.id) {
        return res.status(409).json({ message: 'Ya existe un logro con ese tÃ­tulo en la ediciÃ³n seleccionada' });
      }

      goal.editionId = nextEditionId;
      goal.emblemId = nextEmblemId;
      goal.title = nextTitle;
      goal.description = nextDescription;
      goal.type = nextType;
      goal.targetValue = nextTargetValue;
      goal.progressType = nextProgressType;
      goal.isHidden = nextIsHidden;
      goal.isRepeatable = nextIsRepeatable;
      goal.startDate = nextStartDate;
      goal.endDate = nextEndDate;
      await goal.save();

      await req.logAction({
        accion: 'Logro actualizado',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `goalId=${goal.id}; editionId=${nextEditionId}; emblemId=${nextEmblemId}`,
        type: 'info'
      });

      return res.status(200).json(goal);
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar logro');
    }
  };

  deleteGoal = async (req, res) => {
    try {
      const goalId = parseNumber(req.params.id);
      if (!goalId) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const goal = await models.goals.findByPk(goalId);
      if (!goal) return res.status(404).json({ message: 'Logro no encontrado' });

      const [goalProgressCount, grantedEmblemsCount] = await Promise.all([
        models.user_goals.count({ where: { goalId } }),
        models.user_emblems.count({ where: { sourceGoalId: goalId } })
      ]);

      if (goalProgressCount > 0 || grantedEmblemsCount > 0) {
        return res.status(409).json({
          message: 'No se puede eliminar el logro porque ya tiene progreso o emblemas otorgados',
          goalProgressCount,
          grantedEmblemsCount
        });
      }

      await goal.destroy();
      await req.logAction({
        accion: 'Logro eliminado',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `goalId=${goal.id}; title=${goal.title}`,
        type: 'info'
      });
      return res.status(200).json({ message: 'Logro eliminado correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar logro');
    }
  };

  getAchievementCatalog = async (req, res) => {
    try {
      const editionId = parseNumber(req.query?.editionId);

      const emblemWhere = {};
      const goalWhere = {};

      if (editionId) {
        emblemWhere.editionId = editionId;
        goalWhere.editionId = editionId;
      }

      const [emblems, goals] = await Promise.all([
        models.emblems.findAll({
          where: emblemWhere,
          attributes: ['id', 'editionId', 'name', 'rarity', 'color', 'isHidden', 'isActive'],
          order: [['editionId', 'DESC'], ['name', 'ASC']]
        }),
        models.goals.findAll({
          where: goalWhere,
          attributes: ['id', 'editionId', 'emblemId', 'title', 'type', 'progressType', 'targetValue', 'isHidden', 'isRepeatable'],
          order: [['editionId', 'DESC'], ['title', 'ASC']]
        })
      ]);

      await req.logAction({
        accion: 'Catalogo de logros consultado',
        apartado: 'Achievements',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `emblems=${emblems.length}; goals=${goals.length}`,
        type: 'info'
      });

      return res.status(200).json({ emblems, goals });
    } catch (error) {
      handleError(res, req, error, 'Error al cargar catÃ¡logo de logros');
    }
  };
}

const ctrlAchievements = new AchievementsController();
export { ctrlAchievements };
