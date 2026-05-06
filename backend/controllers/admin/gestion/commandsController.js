import { db, models } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';

const normalizeText = (value) => String(value || '').trim();
const normalizeBoolean = (value, defaultValue = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'si', 'activo'].includes(normalized)) return true;
    if (['false', '0', 'no', 'inactivo'].includes(normalized)) return false;
  }
  return defaultValue;
};
const parsePermissions = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeText(item)).filter(Boolean))];
  }
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((item) => normalizeText(item)).filter(Boolean))];
  } catch (_error) {
    return [];
  }
};

class CommandsAdminController {
  getAll = async (req, res) => {
    try {
      const commands = await models.commands.findAll({ order: [['command', 'ASC'], ['id', 'ASC']] });
      await req.logAction({
        accion: 'Catalogo de comandos consultado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `commands=${commands.length}`,
        type: 'info'
      });
      return res.status(200).json({
        commands: commands.map((row) => ({
          ...row.toJSON(),
          permissions: parsePermissions(row.permissions)
        }))
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al cargar comandos de gestiÃ³n');
    }
  };

  getPermissionOptions = async (req, res) => {
    try {
      const permissions = await models.Permissions.findAll({
        attributes: ['id', 'key', 'name', 'description', 'active'],
        where: { active: true },
        order: [['key', 'ASC']]
      });
      await req.logAction({
        accion: 'Opciones de permisos para comandos consultadas',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `permissions=${permissions.length}`,
        type: 'info'
      });
      return res.status(200).json({ permissions });
    } catch (error) {
      return handleError(res, req, error, 'Error al cargar catÃ¡logo de permisos para comandos');
    }
  };

  create = async (req, res) => {
    try {
      const command = normalizeText(req.body?.command);
      const description = normalizeText(req.body?.description);
      const details = normalizeText(req.body?.details);
      const permissions = parsePermissions(req.body?.permissions);
      const active = normalizeBoolean(req.body?.active, true);

      if (!command || !description) {
        return res.status(400).json({ message: 'Comando y descripciÃ³n son obligatorios.' });
      }

      const duplicate = await models.commands.findOne({ where: { command } });
      if (duplicate) {
        return res.status(409).json({ message: 'Ya existe un comando con ese valor.' });
      }

      const created = await models.commands.create({
        command,
        description,
        details,
        permissions: JSON.stringify(permissions),
        active
      });

      await req.logAction({
        accion: 'Comando creado correctamente',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `commandId=${created.id}; command=${command}`,
        type: 'info'
      });

      return res.status(201).json({
        command: {
          ...created.toJSON(),
          permissions
        }
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al crear comando');
    }
  };

  update = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const current = await models.commands.findByPk(id);
      if (!current) return res.status(404).json({ message: 'Comando no encontrado' });

      const command = normalizeText(req.body?.command ?? current.command);
      const description = normalizeText(req.body?.description ?? current.description);
      const details = normalizeText(req.body?.details ?? current.details);
      const permissions = parsePermissions(req.body?.permissions ?? current.permissions);
      const active = req.body?.active === undefined ? Boolean(current.active) : normalizeBoolean(req.body?.active, Boolean(current.active));

      if (!command || !description) {
        return res.status(400).json({ message: 'Comando y descripciÃ³n son obligatorios.' });
      }

      const duplicate = await models.commands.findOne({ where: { command } });
      if (duplicate && duplicate.id !== current.id) {
        return res.status(409).json({ message: 'Ya existe un comando con ese valor.' });
      }

      current.command = command;
      current.description = description;
      current.details = details;
      current.permissions = JSON.stringify(permissions);
      current.active = active;
      await current.save();

      await req.logAction({
        accion: 'Comando actualizado correctamente',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `commandId=${current.id}; command=${command}`,
        type: 'info'
      });

      return res.status(200).json({
        command: {
          ...current.toJSON(),
          permissions
        }
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al actualizar comando');
    }
  };
}

const ctrlCommandsAdmin = new CommandsAdminController();
export { ctrlCommandsAdmin };

