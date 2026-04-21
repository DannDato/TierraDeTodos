import { db, models } from '../../models/index.js';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Op } from 'sequelize';

class NewsController {
  s3 = () => {
    return new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
      },
    });
  };

  getPublicBase = () => {
    if (process.env.R2_PUBLIC_URL) {
      return process.env.R2_PUBLIC_URL.replace(/\/$/, '');
    }
    return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`.replace(/\/$/, '');
  };

  getNews = async (_req, res) => {
    try {
      const minDate = new Date();
      minDate.setMonth(minDate.getMonth() - 4);

      const rows = await models.news.findAll({
        where: {
          fecha: {
            [Op.gte]: minDate.toISOString().slice(0, 10)
          }
        },
        order: [['fecha', 'DESC'], ['id', 'DESC']]
      });

      return res.status(200).json({
        news: rows
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  getNewsTypes = async (_req, res) => {
    try {
      const types = await models.news_types.findAll({
        order: [['name', 'ASC'], ['id', 'ASC']]
      });

      return res.status(200).json({ types });
    } catch (_error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  createNews = async (req, res) => {
    const tx = await db.transaction();
    try {
      const title = String(req.body?.title || '').trim();
      const type = String(req.body?.type || 'NOTICIA').trim().toUpperCase();
      const fecha = String(req.body?.fecha || '').trim();
      const description = String(req.body?.description || '').trim();
      const image = String(req.body?.image || '').trim();
      const note = String(req.body?.note || '').trim();
      const reporterInput = String(req.body?.Reporter || '').trim();

      if (!title || !description || !fecha) {
        await tx.rollback();
        return res.status(400).json({ message: 'Título, fecha y descripción son obligatorios.' });
      }

      const typeExists = await models.news_types.findOne({ where: { name: type } });
      if (!typeExists) {
        await tx.rollback();
        return res.status(400).json({ message: 'El tipo de noticia no es válido.' });
      }

      const newsCreated = await models.news.create({
        title,
        type,
        fecha,
        description,
        image: image || null,
        note: note || null,
        Reporter: reporterInput || req.user?.username || 'Sistema'
      }, { transaction: tx });

      await tx.commit();

      return res.status(201).json({
        message: 'Noticia creada correctamente.',
        news: newsCreated
      });
    } catch (error) {
      await tx.rollback();
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  updateNews = async (req, res) => {
    try {
      const newsId = Number(req.params.id);
      if (!newsId) {
        return res.status(400).json({ message: 'ID de noticia inválido.' });
      }

      const row = await models.news.findByPk(newsId);
      if (!row) {
        return res.status(404).json({ message: 'Noticia no encontrada.' });
      }

      const username = String(req.user?.username || '').trim();
      if (!username || String(row.Reporter || '').trim() !== username) {
        return res.status(403).json({ message: 'Solo el autor puede editar esta noticia.' });
      }

      const title = String(req.body?.title ?? row.title).trim();
      const type = String(req.body?.type ?? row.type).trim().toUpperCase();
      const fecha = String(req.body?.fecha ?? row.fecha).trim();
      const description = String(req.body?.description ?? row.description).trim();
      const note = String(req.body?.note ?? row.note ?? '').trim();

      if (!title || !description || !fecha) {
        return res.status(400).json({ message: 'Título, fecha y descripción son obligatorios.' });
      }

      const typeExists = await models.news_types.findOne({ where: { name: type } });
      if (!typeExists) {
        return res.status(400).json({ message: 'El tipo de noticia no es válido.' });
      }

      row.title = title;
      row.type = type;
      row.fecha = fecha;
      row.description = description;
      row.note = note || null;
      await row.save();

      return res.status(200).json({
        message: 'Noticia actualizada correctamente.',
        news: row,
      });
    } catch (_error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  uploadNewsImage = async (req, res) => {
    try {
      const newsId = Number(req.params.id);
      if (!newsId) {
        return res.status(400).json({ message: 'ID de noticia inválido.' });
      }

      const row = await models.news.findByPk(newsId);
      if (!row) {
        return res.status(404).json({ message: 'Noticia no encontrada.' });
      }

      const username = String(req.user?.username || '').trim();
      if (!username || String(row.Reporter || '').trim() !== username) {
        return res.status(403).json({ message: 'Solo el autor puede cambiar la imagen de esta noticia.' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
      }

      const extByMime = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
      };

      const extension = extByMime[file.mimetype] || 'webp';
      const folder = process.env.R2_FOLDER || 'tdt3';
      const key = `${folder}/news/${row.id}/news_${Date.now()}.${extension}`;

      await this.s3().send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      const publicBase = this.getPublicBase();
      const imageUrl = `${publicBase}/${key}`;

      const oldImage = String(row.image || '');
      if (oldImage && oldImage.startsWith(`${publicBase}/`)) {
        const oldKey = oldImage.slice(publicBase.length + 1);
        if (oldKey) {
          await this.s3().send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: oldKey,
          }));
        }
      }

      row.image = imageUrl;
      await row.save();

      return res.status(200).json({
        message: 'Imagen de noticia actualizada.',
        news: row,
      });
    } catch (_error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  deleteNews = async (req, res) => {
    try {
      const newsId = Number(req.params.id);
      if (!newsId) {
        return res.status(400).json({ message: 'ID de noticia invalido.' });
      }

      const row = await models.news.findByPk(newsId);
      if (!row) {
        return res.status(404).json({ message: 'Noticia no encontrada.' });
      }

      const publicBase = this.getPublicBase();
      const oldImage = String(row.image || '');
      if (oldImage && oldImage.startsWith(`${publicBase}/`)) {
        const oldKey = oldImage.slice(publicBase.length + 1);
        if (oldKey) {
          await this.s3().send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: oldKey,
          }));
        }
      }

      await row.destroy();

      return res.status(200).json({
        message: 'Noticia eliminada correctamente.'
      });
    } catch (_error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  getNewsComments = async (req, res) => {
    try {
      const newsId = Number(req.params.id);
      if (!newsId) {
        return res.status(400).json({ message: 'ID de noticia invalido.' });
      }

      const targetNews = await models.news.findByPk(newsId, { attributes: ['id'] });
      if (!targetNews) {
        return res.status(404).json({ message: 'Noticia no encontrada.' });
      }

      const comments = await db.query(
        `
          SELECT
            nc.id,
            nc.comment,
            nc.createdAt,
            nc.updatedAt,
            u.id AS userId,
            u.username,
            (
              SELECT upi.img
              FROM user_profile_images upi
              WHERE upi.userId = u.id
              ORDER BY upi.id DESC
              LIMIT 1
            ) AS avatarUrl
          FROM news_comments nc
          INNER JOIN Users u ON u.id = nc.user_id
          WHERE nc.news_id = :newsId
          ORDER BY nc.createdAt ASC, nc.id ASC
        `,
        {
          replacements: { newsId },
          type: db.QueryTypes.SELECT
        }
      );

      return res.status(200).json({ comments });
    } catch (_error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  createNewsComment = async (req, res) => {
    try {
      const newsId = Number(req.params.id);
      if (!newsId) {
        return res.status(400).json({ message: 'ID de noticia invalido.' });
      }

      const commentText = String(req.body?.comment || '').trim();
      if (!commentText) {
        return res.status(400).json({ message: 'El comentario no puede estar vacio.' });
      }

      if (commentText.length > 1000) {
        return res.status(400).json({ message: 'El comentario supera el limite de 1000 caracteres.' });
      }

      const targetNews = await models.news.findByPk(newsId, { attributes: ['id'] });
      if (!targetNews) {
        return res.status(404).json({ message: 'Noticia no encontrada.' });
      }

      const userId = Number(req.user?.id);
      if (!userId) {
        return res.status(401).json({ message: 'Sesion invalida.' });
      }

      const created = await models.news_comments.create({
        newsId,
        userId,
        comment: commentText,
      });

      const [avatarRow] = await db.query(
        `
          SELECT upi.img AS avatarUrl
          FROM user_profile_images upi
          WHERE upi.userId = :userId
          ORDER BY upi.id DESC
          LIMIT 1
        `,
        {
          replacements: { userId },
          type: db.QueryTypes.SELECT
        }
      );

      return res.status(201).json({
        message: 'Comentario publicado correctamente.',
        comment: {
          id: created.id,
          comment: created.comment,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          userId,
          username: String(req.user?.username || 'Usuario'),
          avatarUrl: avatarRow?.avatarUrl || null,
        }
      });
    } catch (_error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}

const ctrlNews = new NewsController();
export { ctrlNews };
