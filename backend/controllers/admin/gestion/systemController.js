import { models } from '../../../models/index.js';

const ALLOWED_TYPES = new Set(['json', 'string', 'number', 'boolean', 'array']);

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const sanitizeLinks = (value) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const keys = ['website', 'youtube', 'discord', 'instagram', 'x', 'twitch'];
  const links = {};

  for (const key of keys) {
    links[key] = String(source[key] || '').trim();
  }

  return links;
};

class SystemAdminController {
  getSettings = async (req, res) => {
    try {
      const settings = await models.system.findAll({
        order: [['category', 'ASC'], ['key', 'ASC']]
      });

      await req.logAction({
        accion: 'Configuraciones administrativas consultadas',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `settings=${settings.length}`,
        type: 'info'
      });

      return res.status(200).json({ settings });
    } catch (error) {
      return req.logAction({
        accion: 'Error al cargar configuraciones administrativas',
        apartado: 'Gestion',
        valor: error.message,
        type: 'error'
      }).finally(() => res.status(500).json({ message: 'Error interno del servidor' }));
    }
  };

  getLinks = async (req, res) => {
    try {
      const row = await models.system.findOne({ where: { key: 'links.social' } });
      const fallback = sanitizeLinks({});
      const links = sanitizeLinks(row?.value || fallback);

      await req.logAction({
        accion: 'Links administrativos consultados',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        type: 'info'
      });

      return res.status(200).json({
        key: row?.key || 'links.social',
        links,
      });
    } catch (error) {
      return req.logAction({
        accion: 'Error al cargar links administrativos',
        apartado: 'Gestion',
        valor: error.message,
        type: 'error'
      }).finally(() => res.status(500).json({ message: 'Error interno del servidor' }));
    }
  };

  updateLinks = async (req, res) => {
    try {
      const payload = req.body?.links;
      const links = sanitizeLinks(payload);

      const [row] = await models.system.findOrCreate({
        where: { key: 'links.social' },
        defaults: {
          key: 'links.social',
          name: 'Links Sociales',
          description: 'Enlaces globales de redes y canales oficiales.',
          category: 'links',
          valueType: 'json',
          value: links,
          visibility: 'public',
          editable: true,
          active: true,
        }
      });

      row.value = links;
      row.visibility = 'public';
      row.valueType = 'json';
      row.active = true;
      await row.save();

      await req.logAction({
        accion: 'Links del sistema actualizados',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        type: 'info'
      });

      return res.status(200).json({
        message: 'Links del sistema actualizados correctamente.',
        links,
      });
    } catch (error) {
      return req.logAction({
        accion: 'Error al actualizar links del sistema',
        apartado: 'Gestion',
        valor: error.message,
        type: 'error'
      }).finally(() => res.status(500).json({ message: 'Error interno del servidor' }));
    }
  };

  upsertSetting = async (req, res) => {
    try {
      const key = normalizeKey(req.params.key);
      if (!key || !/^[a-z0-9._-]+$/.test(key)) {
        return res.status(400).json({ message: 'Clave de configuracion invalida.' });
      }

      const name = String(req.body?.name || key).trim();
      const description = String(req.body?.description || '').trim();
      const category = String(req.body?.category || 'general').trim().toLowerCase();
      const valueType = String(req.body?.valueType || 'json').trim().toLowerCase();
      const visibility = String(req.body?.visibility || 'private').trim().toLowerCase();
      const editable = req.body?.editable !== false;
      const active = req.body?.active !== false;
      const value = req.body?.value;

      if (!name) {
        return res.status(400).json({ message: 'El nombre es obligatorio.' });
      }

      if (!ALLOWED_TYPES.has(valueType)) {
        return res.status(400).json({ message: 'Tipo de valor no valido.' });
      }

      if (!['public', 'private'].includes(visibility)) {
        return res.status(400).json({ message: 'Visibilidad no valida.' });
      }

      const [row] = await models.system.findOrCreate({
        where: { key },
        defaults: {
          key,
          name,
          description,
          category,
          valueType,
          value: value ?? {},
          visibility,
          editable,
          active,
        }
      });

      row.name = name;
      row.description = description || null;
      row.category = category || 'general';
      row.valueType = valueType;
      row.value = value ?? {};
      row.visibility = visibility;
      row.editable = editable;
      row.active = active;
      await row.save();

      await req.logAction({
        accion: 'Configuracion administrativa guardada',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `key=${key}; valueType=${valueType}; visibility=${visibility}`,
        type: 'info'
      });

      return res.status(200).json({
        message: 'Configuracion guardada correctamente.',
        setting: row,
      });
    } catch (error) {
      return req.logAction({
        accion: 'Error al guardar configuracion administrativa',
        apartado: 'Gestion',
        valor: error.message,
        type: 'error'
      }).finally(() => res.status(500).json({ message: 'Error interno del servidor' }));
    }
  };
}

const ctrlSystemAdmin = new SystemAdminController();
export { ctrlSystemAdmin };

