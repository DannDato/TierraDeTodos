import { models } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';

const ACTIVE_VALUES = ['YES', 'NO'];

const normalizeKey = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
const normalizeText = (value) => String(value || '').trim();

class TicketCatalogsController {
  getCatalogs = async (req, res) => {
    try {
      const [types, priorities] = await Promise.all([
        models.ticket_types.findAll({ order: [['name', 'ASC'], ['id', 'ASC']] }),
        models.tickets_prioritys.findAll({ order: [['name', 'ASC'], ['id', 'ASC']] })
      ]);

      return res.status(200).json({
        types,
        priorities
      });
    } catch (error) {
      handleError(res, req, error, 'Error al cargar catálogos de tickets');
    }
  };

  createType = async (req, res) => {
    try {
      const key = normalizeKey(req.body?.key);
      const name = normalizeText(req.body?.name);
      const detail = normalizeText(req.body?.detail);
      const color = normalizeText(req.body?.color) || '#8a8a8a';
      const active = String(req.body?.active || 'YES').toUpperCase();

      if (!key || !name) {
        return res.status(400).json({ message: 'key y name son obligatorios' });
      }

      if (!ACTIVE_VALUES.includes(active)) {
        return res.status(400).json({ message: 'active inválido' });
      }

      const exists = await models.ticket_types.findOne({ where: { key } });
      if (exists) {
        return res.status(409).json({ message: 'Ya existe un tipo con esa clave' });
      }

      const created = await models.ticket_types.create({ key, name, detail: detail || null, color, active });

      return res.status(201).json(created);
    } catch (error) {
      handleError(res, req, error, 'Error al crear tipo de ticket');
    }
  };

  updateType = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID inválido' });

      const type = await models.ticket_types.findByPk(id);
      if (!type) return res.status(404).json({ message: 'Tipo no encontrado' });

      if (type.immutable) {
        return res.status(403).json({ message: 'No se puede editar un tipo protegido' });
      }

      const nextKey = normalizeKey(req.body?.key ?? type.key);
      const nextName = normalizeText(req.body?.name ?? type.name);
      const nextDetail = normalizeText(req.body?.detail ?? type.detail);
      const nextColor = normalizeText(req.body?.color ?? type.color) || '#8a8a8a';
      const nextActive = String(req.body?.active ?? type.active).toUpperCase();

      if (!nextKey || !nextName) {
        return res.status(400).json({ message: 'key y name son obligatorios' });
      }

      if (!ACTIVE_VALUES.includes(nextActive)) {
        return res.status(400).json({ message: 'active inválido' });
      }

      const duplicate = await models.ticket_types.findOne({ where: { key: nextKey } });
      if (duplicate && duplicate.id !== type.id) {
        return res.status(409).json({ message: 'Ya existe un tipo con esa clave' });
      }

      type.key = nextKey;
      type.name = nextName;
      type.detail = nextDetail || null;
      type.color = nextColor;
      type.active = nextActive;
      await type.save();

      return res.status(200).json(type);
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar tipo de ticket');
    }
  };

  deleteType = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID inválido' });

      const type = await models.ticket_types.findByPk(id);
      if (!type) return res.status(404).json({ message: 'Tipo no encontrado' });

      if (type.immutable) {
        return res.status(403).json({ message: 'No se puede eliminar un tipo protegido' });
      }

      await type.destroy();
      return res.status(200).json({ message: 'Tipo eliminado correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar tipo de ticket');
    }
  };

  createPriority = async (req, res) => {
    try {
      const key = normalizeKey(req.body?.key);
      const name = normalizeText(req.body?.name);
      const detail = normalizeText(req.body?.detail);
      const color = normalizeText(req.body?.color) || '#8a8a8a';
      const active = String(req.body?.active || 'YES').toUpperCase();

      if (!key || !name) {
        return res.status(400).json({ message: 'key y name son obligatorios' });
      }

      if (!ACTIVE_VALUES.includes(active)) {
        return res.status(400).json({ message: 'active inválido' });
      }

      const exists = await models.tickets_prioritys.findOne({ where: { key } });
      if (exists) {
        return res.status(409).json({ message: 'Ya existe una prioridad con esa clave' });
      }

      const created = await models.tickets_prioritys.create({ key, name, detail: detail || null, color, active });

      return res.status(201).json(created);
    } catch (error) {
      handleError(res, req, error, 'Error al crear prioridad de ticket');
    }
  };

  updatePriority = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID inválido' });

      const priority = await models.tickets_prioritys.findByPk(id);
      if (!priority) return res.status(404).json({ message: 'Prioridad no encontrada' });

      if (priority.immutable) {
        return res.status(403).json({ message: 'No se puede editar una prioridad protegida' });
      }

      const nextKey = normalizeKey(req.body?.key ?? priority.key);
      const nextName = normalizeText(req.body?.name ?? priority.name);
      const nextDetail = normalizeText(req.body?.detail ?? priority.detail);
      const nextColor = normalizeText(req.body?.color ?? priority.color) || '#8a8a8a';
      const nextActive = String(req.body?.active ?? priority.active).toUpperCase();

      if (!nextKey || !nextName) {
        return res.status(400).json({ message: 'key y name son obligatorios' });
      }

      if (!ACTIVE_VALUES.includes(nextActive)) {
        return res.status(400).json({ message: 'active inválido' });
      }

      const duplicate = await models.tickets_prioritys.findOne({ where: { key: nextKey } });
      if (duplicate && duplicate.id !== priority.id) {
        return res.status(409).json({ message: 'Ya existe una prioridad con esa clave' });
      }

      priority.key = nextKey;
      priority.name = nextName;
      priority.detail = nextDetail || null;
      priority.color = nextColor;
      priority.active = nextActive;
      await priority.save();

      return res.status(200).json(priority);
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar prioridad de ticket');
    }
  };

  deletePriority = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID inválido' });

      const priority = await models.tickets_prioritys.findByPk(id);
      if (!priority) return res.status(404).json({ message: 'Prioridad no encontrada' });

      if (priority.immutable) {
        return res.status(403).json({ message: 'No se puede eliminar una prioridad protegida' });
      }

      await priority.destroy();
      return res.status(200).json({ message: 'Prioridad eliminada correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar prioridad de ticket');
    }
  };
}

const ctrlTicketCatalogs = new TicketCatalogsController();
export { ctrlTicketCatalogs };
