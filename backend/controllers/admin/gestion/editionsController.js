import { db, models } from '../../../models/index.js';
import { Op } from 'sequelize';
import handleError from '../../../handlers/handleError.js';

const EDITION_STATUS = ['ACTIVE', 'INACTIVE'];
const RULE_CATEGORIES = ['PRINCIPAL', 'OBLIGACION', 'TECNICO', 'STAFF'];

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

class EditionsController {
  getEditionResources = async (req, res) => {
    try {
      const editionId = Number(req.params.id);
      if (!editionId) {
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      const editionRecord = await models.Edition.findByPk(editionId);
      if (!editionRecord) {
        return res.status(404).json({ message: 'Edición no encontrada' });
      }

      const [dates, rules, previousEdition] = await Promise.all([
        models.EditionDates.findAll({
          where: { editionId, active: 'YES' },
          order: [['date', 'ASC'], ['id', 'ASC']]
        }),
        models.EditionRules.findAll({
          where: { editionId, active: 'YES' },
          order: [['sortOrder', 'ASC'], ['id', 'ASC']]
        }),
        models.Edition.findOne({
          where: { id: { [Op.lt]: editionId } },
          attributes: ['id', 'name', 'number'],
          order: [['id', 'DESC']]
        })
      ]);

      return res.status(200).json({
        edition: editionRecord,
        dates,
        rules,
        previousEdition
      });
    } catch (error) {
      handleError(res, req, error, 'Error al cargar recursos de la edición');
    }
  };

  getEditions = async (req, res) => {
    try {
      const editions = await models.Edition.findAll({
        order: [['id', 'DESC']]
      });

      const usageRows = await models.UserEdition.findAll({
        attributes: [
          'editionId',
          [db.fn('COUNT', db.col('userID')), 'users']
        ],
        group: ['editionId'],
        raw: true
      });

      const usageMap = usageRows.reduce((acc, row) => {
        acc[row.editionId] = Number(row.users || 0);
        return acc;
      }, {});

      return res.status(200).json(
        editions.map((edition) => ({
          id: edition.id,
          name: edition.name,
          number: edition.number,
          color: edition.color,
          status: edition.status,
          date_start: edition.date_start,
          date_end: edition.date_end,
          description: edition.description,
          users: usageMap[edition.id] || 0
        }))
      );
    } catch (error) {
      handleError(res, req, error, 'Error al listar ediciones');
    }
  };

  createEdition = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const {
        name,
        number,
        color = '#1f2937',
        status = 'INACTIVE',
        date_start,
        date_end,
        description = ''
      } = req.body || {};

      const normalizedName = String(name || '').trim();
      const normalizedNumber = String(number || '').trim();
      const normalizedStatus = String(status || 'INACTIVE').trim().toUpperCase();
      const normalizedDescription = String(description || '').trim();

      if (!normalizedName || !normalizedNumber) {
        await transaction.rollback();
        return res.status(400).json({ message: 'name y number son obligatorios' });
      }

      if (!EDITION_STATUS.includes(normalizedStatus)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'status inválido' });
      }

      const parsedStart = parseDate(date_start);
      const parsedEnd = parseDate(date_end);

      if (!parsedStart) {
        await transaction.rollback();
        return res.status(400).json({ message: 'date_start es obligatorio y debe ser una fecha válida' });
      }

      if (date_end && !parsedEnd) {
        await transaction.rollback();
        return res.status(400).json({ message: 'date_end no tiene un formato válido' });
      }

      if (parsedEnd && parsedEnd < parsedStart) {
        await transaction.rollback();
        return res.status(400).json({ message: 'date_end no puede ser menor que date_start' });
      }

      const duplicated = await models.Edition.findOne({ where: { number: normalizedNumber }, transaction });
      if (duplicated) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe una edición con ese número' });
      }

      if (normalizedStatus === 'ACTIVE') {
        await models.Edition.update(
          { status: 'INACTIVE' },
          { where: { status: 'ACTIVE' }, transaction }
        );
      }

      const createdEdition = await models.Edition.create(
        {
          name: normalizedName,
          number: normalizedNumber,
          color,
          status: normalizedStatus,
          date_start: parsedStart,
          date_end: parsedEnd,
          description: normalizedDescription || null
        },
        { transaction }
      );

      await transaction.commit();

      await req.logAction({
        accion: 'Edición creada',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `edition=${createdEdition.number}; status=${createdEdition.status}`,
        type: 'info'
      });

      return res.status(201).json({
        id: createdEdition.id,
        name: createdEdition.name,
        number: createdEdition.number,
        color: createdEdition.color,
        status: createdEdition.status,
        date_start: createdEdition.date_start,
        date_end: createdEdition.date_end,
        description: createdEdition.description,
        users: 0
      });
    } catch (error) {
      handleError(res, req, error, 'Error al crear edición', transaction);
    }
  };

  updateEdition = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      const { name, number, color, status, date_start, date_end, description } = req.body || {};

      if (!editionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      const editionRecord = await models.Edition.findByPk(editionId, { transaction });
      if (!editionRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Edición no encontrada' });
      }

      const nextName = String(name ?? editionRecord.name).trim();
      const nextNumber = String(number ?? editionRecord.number).trim();
      const nextStatus = String(status ?? editionRecord.status).trim().toUpperCase();
      const nextDescription = String(description ?? editionRecord.description ?? '').trim();

      if (!nextName || !nextNumber) {
        await transaction.rollback();
        return res.status(400).json({ message: 'name y number son obligatorios' });
      }

      if (!EDITION_STATUS.includes(nextStatus)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'status inválido' });
      }

      const parsedStart = parseDate(date_start ?? editionRecord.date_start);
      const parsedEnd = parseDate(date_end ?? editionRecord.date_end);

      if (!parsedStart) {
        await transaction.rollback();
        return res.status(400).json({ message: 'date_start es obligatorio y debe ser una fecha válida' });
      }

      if ((date_end ?? editionRecord.date_end) && !parsedEnd) {
        await transaction.rollback();
        return res.status(400).json({ message: 'date_end no tiene un formato válido' });
      }

      if (parsedEnd && parsedEnd < parsedStart) {
        await transaction.rollback();
        return res.status(400).json({ message: 'date_end no puede ser menor que date_start' });
      }

      const duplicated = await models.Edition.findOne({
        where: { number: nextNumber },
        transaction
      });

      if (duplicated && duplicated.id !== editionRecord.id) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe una edición con ese número' });
      }

      if (nextStatus === 'ACTIVE') {
        await models.Edition.update(
          { status: 'INACTIVE' },
          { where: { status: 'ACTIVE' }, transaction }
        );
      }

      editionRecord.name = nextName;
      editionRecord.number = nextNumber;
      editionRecord.color = color || editionRecord.color;
      editionRecord.status = nextStatus;
      editionRecord.date_start = parsedStart;
      editionRecord.date_end = parsedEnd;
      editionRecord.description = nextDescription || null;
      await editionRecord.save({ transaction });

      await transaction.commit();

      await req.logAction({
        accion: 'Edición actualizada',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${editionRecord.id}; number=${editionRecord.number}; status=${editionRecord.status}`,
        type: 'info'
      });

      return res.status(200).json({
        id: editionRecord.id,
        name: editionRecord.name,
        number: editionRecord.number,
        color: editionRecord.color,
        status: editionRecord.status,
        date_start: editionRecord.date_start,
        date_end: editionRecord.date_end,
        description: editionRecord.description
      });
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar edición', transaction);
    }
  };

  openEdition = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      if (!editionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      const editionRecord = await models.Edition.findByPk(editionId, { transaction });
      if (!editionRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Edición no encontrada' });
      }

      await models.Edition.update(
        {
          status: 'INACTIVE',
          date_end: db.literal('COALESCE(date_end, NOW())')
        },
        {
          where: { status: 'ACTIVE', id: { [Op.ne]: editionId } },
          transaction
        }
      );

      editionRecord.status = 'ACTIVE';
      if (!editionRecord.date_start) {
        editionRecord.date_start = new Date();
      }
      await editionRecord.save({ transaction });

      await transaction.commit();

      await req.logAction({
        accion: 'Edición aperturada',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${editionRecord.id}; number=${editionRecord.number}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Edición aperturada correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al aperturar edición', transaction);
    }
  };

  closeEdition = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      if (!editionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      const editionRecord = await models.Edition.findByPk(editionId, { transaction });
      if (!editionRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Edición no encontrada' });
      }

      editionRecord.status = 'INACTIVE';
      editionRecord.date_end = editionRecord.date_end || new Date();
      await editionRecord.save({ transaction });

      await transaction.commit();

      await req.logAction({
        accion: 'Edición cerrada',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${editionRecord.id}; number=${editionRecord.number}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Edición cerrada correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al cerrar edición', transaction);
    }
  };

  deleteEdition = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      if (!editionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      const editionRecord = await models.Edition.findByPk(editionId, { transaction });
      if (!editionRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Edición no encontrada' });
      }

      const linkedUsers = await models.UserEdition.count({
        where: { editionId: editionId },
        transaction
      });

      if (linkedUsers > 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'No se puede eliminar: hay usuarios asociados a esta edición' });
      }

      await editionRecord.destroy({ transaction });
      await transaction.commit();

      await req.logAction({
        accion: 'Edición eliminada',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${editionId}; number=${editionRecord.number}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Edición eliminada correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar edición', transaction);
    }
  };

  createEditionDate = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      const { date, name, description = '', emoji = '', color = '#9ca3af' } = req.body || {};

      if (!editionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      const editionRecord = await models.Edition.findByPk(editionId, { transaction });
      if (!editionRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Edición no encontrada' });
      }

      const parsedDate = parseDate(date);
      const normalizedName = String(name || '').trim();

      if (!parsedDate || !normalizedName) {
        await transaction.rollback();
        return res.status(400).json({ message: 'date y name son obligatorios' });
      }

      const duplicated = await models.EditionDates.findOne({
        where: { editionId, date: parsedDate, name: normalizedName },
        transaction
      });

      if (duplicated) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe una fecha con ese nombre en el mismo día' });
      }

      const createdDate = await models.EditionDates.create({
        editionId,
        date: parsedDate,
        name: normalizedName,
        description: String(description || '').trim() || null,
        emoji: String(emoji || '').trim() || null,
        color: color || '#9ca3af',
        active: 'YES'
      }, { transaction });

      await transaction.commit();

      return res.status(201).json(createdDate);
    } catch (error) {
      handleError(res, req, error, 'Error al crear fecha de edición', transaction);
    }
  };

  updateEditionDate = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      const dateId = Number(req.params.dateId);
      const { date, name, description = '', emoji = '', color = '#9ca3af', active } = req.body || {};

      if (!editionId || !dateId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID inválido' });
      }

      const dateRecord = await models.EditionDates.findOne({ where: { id: dateId, editionId }, transaction });
      if (!dateRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Fecha no encontrada' });
      }

      const parsedDate = parseDate(date ?? dateRecord.date);
      const normalizedName = String(name ?? dateRecord.name).trim();

      if (!parsedDate || !normalizedName) {
        await transaction.rollback();
        return res.status(400).json({ message: 'date y name son obligatorios' });
      }

      const duplicated = await models.EditionDates.findOne({
        where: {
          editionId,
          date: parsedDate,
          name: normalizedName,
          id: { [Op.ne]: dateId }
        },
        transaction
      });

      if (duplicated) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe una fecha con ese nombre en el mismo día' });
      }

      dateRecord.date = parsedDate;
      dateRecord.name = normalizedName;
      dateRecord.description = String(description ?? dateRecord.description ?? '').trim() || null;
      dateRecord.emoji = String(emoji ?? dateRecord.emoji ?? '').trim() || null;
      dateRecord.color = color || dateRecord.color;
      dateRecord.active = ['YES', 'NO'].includes(active) ? active : dateRecord.active;
      await dateRecord.save({ transaction });

      await transaction.commit();

      return res.status(200).json(dateRecord);
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar fecha de edición', transaction);
    }
  };

  deleteEditionDate = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      const dateId = Number(req.params.dateId);

      if (!editionId || !dateId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID inválido' });
      }

      const dateRecord = await models.EditionDates.findOne({ where: { id: dateId, editionId }, transaction });
      if (!dateRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Fecha no encontrada' });
      }

      await dateRecord.destroy({ transaction });
      await transaction.commit();

      return res.status(200).json({ message: 'Fecha eliminada correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar fecha de edición', transaction);
    }
  };

  importDatesFromPreviousEdition = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      if (!editionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      const previousEdition = await models.Edition.findOne({
        where: { id: { [Op.lt]: editionId } },
        order: [['id', 'DESC']],
        transaction
      });

      if (!previousEdition) {
        await transaction.rollback();
        return res.status(404).json({ message: 'No existe una edición anterior para importar' });
      }

      const previousDates = await models.EditionDates.findAll({
        where: { editionId: previousEdition.id, active: 'YES' },
        transaction
      });

      let importedCount = 0;
      for (const row of previousDates) {
        const exists = await models.EditionDates.findOne({
          where: { editionId, date: row.date, name: row.name },
          transaction
        });

        if (!exists) {
          await models.EditionDates.create({
            editionId,
            date: row.date,
            name: row.name,
            description: row.description,
            emoji: row.emoji,
            color: row.color,
            active: row.active
          }, { transaction });
          importedCount += 1;
        }
      }

      await transaction.commit();
      return res.status(200).json({ message: 'Fechas importadas correctamente', importedCount });
    } catch (error) {
      handleError(res, req, error, 'Error al importar fechas', transaction);
    }
  };

  createEditionRule = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      const { category, item, icon = '', color = '#ffffff', sortOrder } = req.body || {};
      const normalizedCategory = String(category || '').trim().toUpperCase();
      const normalizedItem = String(item || '').trim();

      if (!editionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      if (!RULE_CATEGORIES.includes(normalizedCategory) || !normalizedItem) {
        await transaction.rollback();
        return res.status(400).json({ message: 'category e item son obligatorios y válidos' });
      }

      const duplicated = await models.EditionRules.findOne({
        where: { editionId, category: normalizedCategory, item: normalizedItem },
        transaction
      });

      if (duplicated) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe esa regla en la categoría indicada' });
      }

      const createdRule = await models.EditionRules.create({
        editionId,
        category: normalizedCategory,
        item: normalizedItem,
        icon: String(icon || '').trim() || null,
        color: color || '#ffffff',
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        active: 'YES'
      }, { transaction });

      await transaction.commit();
      return res.status(201).json(createdRule);
    } catch (error) {
      handleError(res, req, error, 'Error al crear regla', transaction);
    }
  };

  updateEditionRule = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      const ruleId = Number(req.params.ruleId);
      const { category, item, icon = '', color = '#ffffff', sortOrder, active } = req.body || {};
      const ruleRecord = await models.EditionRules.findOne({ where: { id: ruleId, editionId }, transaction });

      if (!editionId || !ruleId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID inválido' });
      }

      if (!ruleRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Regla no encontrada' });
      }

      const normalizedCategory = String(category ?? ruleRecord.category).trim().toUpperCase();
      const normalizedItem = String(item ?? ruleRecord.item).trim();

      if (!RULE_CATEGORIES.includes(normalizedCategory) || !normalizedItem) {
        await transaction.rollback();
        return res.status(400).json({ message: 'category e item son obligatorios y válidos' });
      }

      const duplicated = await models.EditionRules.findOne({
        where: {
          editionId,
          category: normalizedCategory,
          item: normalizedItem,
          id: { [Op.ne]: ruleId }
        },
        transaction
      });

      if (duplicated) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe esa regla en la categoría indicada' });
      }

      ruleRecord.category = normalizedCategory;
      ruleRecord.item = normalizedItem;
      ruleRecord.icon = String(icon ?? ruleRecord.icon ?? '').trim() || null;
      ruleRecord.color = color || ruleRecord.color;
      ruleRecord.sortOrder = Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : ruleRecord.sortOrder;
      ruleRecord.active = ['YES', 'NO'].includes(active) ? active : ruleRecord.active;
      await ruleRecord.save({ transaction });

      await transaction.commit();
      return res.status(200).json(ruleRecord);
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar regla', transaction);
    }
  };

  deleteEditionRule = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      const ruleId = Number(req.params.ruleId);

      if (!editionId || !ruleId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID inválido' });
      }

      const ruleRecord = await models.EditionRules.findOne({ where: { id: ruleId, editionId }, transaction });
      if (!ruleRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Regla no encontrada' });
      }

      await ruleRecord.destroy({ transaction });
      await transaction.commit();

      return res.status(200).json({ message: 'Regla eliminada correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar regla', transaction);
    }
  };

  importRulesFromPreviousEdition = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const editionId = Number(req.params.id);
      if (!editionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de edición inválido' });
      }

      const previousEdition = await models.Edition.findOne({
        where: { id: { [Op.lt]: editionId } },
        order: [['id', 'DESC']],
        transaction
      });

      if (!previousEdition) {
        await transaction.rollback();
        return res.status(404).json({ message: 'No existe una edición anterior para importar' });
      }

      const previousRules = await models.EditionRules.findAll({
        where: { editionId: previousEdition.id, active: 'YES' },
        order: [['sortOrder', 'ASC'], ['id', 'ASC']],
        transaction
      });

      let importedCount = 0;
      for (const row of previousRules) {
        const exists = await models.EditionRules.findOne({
          where: { editionId, category: row.category, item: row.item },
          transaction
        });

        if (!exists) {
          await models.EditionRules.create({
            editionId,
            category: row.category,
            item: row.item,
            icon: row.icon,
            color: row.color,
            sortOrder: row.sortOrder,
            active: row.active
          }, { transaction });
          importedCount += 1;
        }
      }

      await transaction.commit();
      return res.status(200).json({ message: 'Reglas importadas correctamente', importedCount });
    } catch (error) {
      handleError(res, req, error, 'Error al importar reglas', transaction);
    }
  };
}

const ctrlEditions = new EditionsController();
export { ctrlEditions };
