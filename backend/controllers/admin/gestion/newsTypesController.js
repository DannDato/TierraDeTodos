import { models } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';

const normalizeText = (value) => String(value || '').trim();

class NewsTypesController {
  getAll = async (req, res) => {
    try {
      const types = await models.catalog.findAll({
        where: { category: 'news_type' },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });

      await req.logAction({
        accion: 'Tipos de noticias de gestion consultados',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `types=${types.length}`,
        type: 'info'
      });

      return res.status(200).json({ types });
    } catch (error) {
      return handleError(res, req, error, 'Error al cargar tipos de noticias');
    }
  };

  create = async (req, res) => {
    try {
      const name = normalizeText(req.body?.name).toUpperCase();
      const description = normalizeText(req.body?.description) || null;
      const color = normalizeText(req.body?.color) || '#f59e0b';

      if (!name) {
        return res.status(400).json({ message: 'El nombre es obligatorio.' });
      }

      const exists = await models.catalog.findOne({ where: { category: 'news_type', key: name } });
      if (exists) {
        return res.status(409).json({ message: 'Ya existe un tipo con ese nombre.' });
      }

      const created = await models.catalog.create({ category: 'news_type', key: name, name, detail: description, color });
      await req.logAction({
        accion: 'Tipo de noticia creado correctamente',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `typeId=${created.id}; name=${name}`,
        type: 'info'
      });
      return res.status(201).json({ type: created });
    } catch (error) {
      return handleError(res, req, error, 'Error al crear tipo de noticia');
    }
  };

  update = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const current = await models.catalog.findOne({ where: { id, category: 'news_type' } });
      if (!current) return res.status(404).json({ message: 'Tipo no encontrado' });

      const name = normalizeText(req.body?.name ?? current.name).toUpperCase();
      const description = normalizeText(req.body?.description ?? current.detail) || null;
      const color = normalizeText(req.body?.color ?? current.color) || '#f59e0b';

      if (!name) {
        return res.status(400).json({ message: 'El nombre es obligatorio.' });
      }

      const duplicate = await models.catalog.findOne({ where: { category: 'news_type', key: name } });
      if (duplicate && duplicate.id !== current.id) {
        return res.status(409).json({ message: 'Ya existe un tipo con ese nombre.' });
      }

      current.key = name;
      current.name = name;
      current.detail = description;
      current.color = color;
      await current.save();

      await req.logAction({
        accion: 'Tipo de noticia actualizado correctamente',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `typeId=${current.id}; name=${name}`,
        type: 'info'
      });

      return res.status(200).json({ type: current });
    } catch (error) {
      return handleError(res, req, error, 'Error al actualizar tipo de noticia');
    }
  };

  remove = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID invÃ¡lido' });

      const current = await models.catalog.findOne({ where: { id, category: 'news_type' } });
      if (!current) return res.status(404).json({ message: 'Tipo no encontrado' });

      const inUse = await models.news.findOne({ where: { type: current.key } });
      if (inUse) {
        return res.status(409).json({ message: 'No se puede eliminar un tipo que ya estÃ¡ en uso por noticias.' });
      }

      await current.destroy();
      await req.logAction({
        accion: 'Tipo de noticia eliminado correctamente',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `typeId=${current.id}; name=${current.name}`,
        type: 'info'
      });
      return res.status(200).json({ message: 'Tipo eliminado correctamente' });
    } catch (error) {
      return handleError(res, req, error, 'Error al eliminar tipo de noticia');
    }
  };
}

const ctrlNewsTypes = new NewsTypesController();
export { ctrlNewsTypes };

