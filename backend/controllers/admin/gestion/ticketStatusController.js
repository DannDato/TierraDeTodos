import { models } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';

const ACTIVE_VALUES = ['YES', 'NO'];
const normalizeKey  = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
const normalizeText = (value) => String(value || '').trim();

class TicketStatusController {
  getAll = async (req, res) => {
    try {
      const statuses = await models.catalog.findAll({
        where: { category: 'ticket_status' },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });
      await req.logAction({
        accion: 'Estatus de tickets consultados',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `statuses=${statuses.length}`,
        type: 'info'
      });
      return res.status(200).json(statuses);
    } catch (error) {
      handleError(res, req, error, 'Error al obtener estatus de tickets');
    }
  };

  create = async (req, res) => {
    try {
      const key    = normalizeKey(req.body?.key);
      const name   = normalizeText(req.body?.name);
      const detail = normalizeText(req.body?.detail) || null;
      const color  = normalizeText(req.body?.color) || '#8a8a8a';
      const active = String(req.body?.active || 'YES').toUpperCase();

      if (!key || !name) {
        return res.status(400).json({ message: 'key y name son obligatorios' });
      }
      if (!ACTIVE_VALUES.includes(active)) {
        return res.status(400).json({ message: 'active invÃ¡lido' });
      }

      const exists = await models.catalog.findOne({ where: { category: 'ticket_status', key } });
      if (exists) {
        return res.status(409).json({ message: 'Ya existe un estatus con esa clave' });
      }

      const created = await models.catalog.create({ category: 'ticket_status', key, name, detail, color, active });
      await req.logAction({
        accion: 'Estatus de ticket creado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `statusId=${created.id}; key=${key}`,
        type: 'info'
      });
      return res.status(201).json(created);
    } catch (error) {
      handleError(res, req, error, 'Error al crear estatus de ticket');
    }
  };

  update = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const status = await models.catalog.findOne({ where: { id, category: 'ticket_status' } });
      if (!status) return res.status(404).json({ message: 'Estatus no encontrado' });
      if (status.immutable) return res.status(403).json({ message: 'No se puede editar un estatus protegido' });

      const nextKey    = normalizeKey(req.body?.key ?? status.key);
      const nextName   = normalizeText(req.body?.name ?? status.name);
      const nextDetail = normalizeText(req.body?.detail ?? status.detail) || null;
      const nextColor  = normalizeText(req.body?.color ?? status.color) || '#8a8a8a';
      const nextActive = String(req.body?.active ?? status.active).toUpperCase();

      if (!nextKey || !nextName) {
        return res.status(400).json({ message: 'key y name son obligatorios' });
      }
      if (!ACTIVE_VALUES.includes(nextActive)) {
        return res.status(400).json({ message: 'active invÃ¡lido' });
      }

      const duplicate = await models.catalog.findOne({ where: { category: 'ticket_status', key: nextKey } });
      if (duplicate && duplicate.id !== status.id) {
        return res.status(409).json({ message: 'Ya existe un estatus con esa clave' });
      }

      status.key    = nextKey;
      status.name   = nextName;
      status.detail = nextDetail;
      status.color  = nextColor;
      status.active = nextActive;
      await status.save();

      await req.logAction({
        accion: 'Estatus de ticket actualizado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `statusId=${status.id}; key=${nextKey}`,
        type: 'info'
      });

      return res.status(200).json(status);
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar estatus de ticket');
    }
  };

  remove = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const status = await models.catalog.findOne({ where: { id, category: 'ticket_status' } });
      if (!status) return res.status(404).json({ message: 'Estatus no encontrado' });
      if (status.immutable) return res.status(403).json({ message: 'No se puede eliminar un estatus protegido' });

      await status.destroy();
      await req.logAction({
        accion: 'Estatus de ticket eliminado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `statusId=${status.id}; key=${status.key}`,
        type: 'info'
      });
      return res.status(200).json({ message: 'Estatus eliminado correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar estatus de ticket');
    }
  };
}

const ctrlTicketStatus = new TicketStatusController();
export { ctrlTicketStatus };

