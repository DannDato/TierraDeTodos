import { models } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';

const normalizeText = (value) => String(value || '').trim();

class NewsTypesController {
  getAll = async (req, res) => {
    try {
      const types = await models.news_types.findAll({
        order: [['name', 'ASC'], ['id', 'ASC']]
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

      const exists = await models.news_types.findOne({ where: { name } });
      if (exists) {
        return res.status(409).json({ message: 'Ya existe un tipo con ese nombre.' });
      }

      const created = await models.news_types.create({ name, description, color });
      return res.status(201).json({ type: created });
    } catch (error) {
      return handleError(res, req, error, 'Error al crear tipo de noticia');
    }
  };

  update = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID inválido' });

      const current = await models.news_types.findByPk(id);
      if (!current) return res.status(404).json({ message: 'Tipo no encontrado' });

      const name = normalizeText(req.body?.name ?? current.name).toUpperCase();
      const description = normalizeText(req.body?.description ?? current.description) || null;
      const color = normalizeText(req.body?.color ?? current.color) || '#f59e0b';

      if (!name) {
        return res.status(400).json({ message: 'El nombre es obligatorio.' });
      }

      const duplicate = await models.news_types.findOne({ where: { name } });
      if (duplicate && duplicate.id !== current.id) {
        return res.status(409).json({ message: 'Ya existe un tipo con ese nombre.' });
      }

      current.name = name;
      current.description = description;
      current.color = color;
      await current.save();

      return res.status(200).json({ type: current });
    } catch (error) {
      return handleError(res, req, error, 'Error al actualizar tipo de noticia');
    }
  };

  remove = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'ID inválido' });

      const current = await models.news_types.findByPk(id);
      if (!current) return res.status(404).json({ message: 'Tipo no encontrado' });

      const inUse = await models.news.findOne({ where: { type: current.name } });
      if (inUse) {
        return res.status(409).json({ message: 'No se puede eliminar un tipo que ya está en uso por noticias.' });
      }

      await current.destroy();
      return res.status(200).json({ message: 'Tipo eliminado correctamente' });
    } catch (error) {
      return handleError(res, req, error, 'Error al eliminar tipo de noticia');
    }
  };
}

const ctrlNewsTypes = new NewsTypesController();
export { ctrlNewsTypes };
