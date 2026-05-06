import { db, models } from '../../models/index.js';
import { LikesValidationError } from '../../models/likes.model.js';
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

  getNews = async (req, res) => {
    try {
      const minDate = new Date();
      minDate.setMonth(minDate.getMonth() - 4);

      const [rows, types] = await Promise.all([
        models.news.findAll({
          where: {
            fecha: {
              [Op.gte]: minDate.toISOString().slice(0, 10)
            }
          },
          order: [['fecha', 'DESC'], ['id', 'DESC']]
        }),
        models.catalog.findAll({
          where: { category: 'news_type', active: 'YES' },
          order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        })
      ]);

      // Si hay usuario autenticado, obtener su id
      const currentUserId = req.user?.id;

      // Cargar likes de noticias en una sola query y hacer join en memoria
      const newsIds = rows.map((r) => r.id);
      const allLikes = newsIds.length > 0
        ? await models.likes.findAll({
            where: { targetType: 'news', targetId: { [Op.in]: newsIds } },
            attributes: ['targetId', 'userId']
          })
        : [];

      const likesByNewsId = new Map();
      for (const like of allLikes) {
        if (!likesByNewsId.has(like.targetId)) likesByNewsId.set(like.targetId, []);
        likesByNewsId.get(like.targetId).push(like.userId);
      }

      const parsedNews = rows.map((row) => {
        const plain = row.toJSON();
        const usersWhoLiked = likesByNewsId.get(plain.id) || [];
        const likesCount = usersWhoLiked.length;
        const likedByCurrentUser = currentUserId ? usersWhoLiked.includes(currentUserId) : false;
        return {
          ...plain,
          likesCount,
          likedByCurrentUser
        };
      });

      await req.logAction({
        accion: 'Noticias consultadas',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `news=${parsedNews.length}; types=${types.length}`,
        type: 'info'
      });

      return res.status(200).json({
        news: parsedNews,
        types
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  getNewsTypes = async (req, res) => {
    try {
      const types = await models.catalog.findAll({
        where: { category: 'news_type', active: 'YES' },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });

      await req.logAction({
        accion: 'Tipos de noticia consultados',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `types=${types.length}`,
        type: 'info'
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
        return res.status(400).json({ message: 'TÃ­tulo, fecha y descripciÃ³n son obligatorios.' });
      }

      const typeExists = await models.catalog.findOne({ where: { category: 'news_type', key: type, active: 'YES' } });
      if (!typeExists) {
        await tx.rollback();
        return res.status(400).json({ message: 'El tipo de noticia no es vÃ¡lido.' });
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

      await req.logAction({
        accion: 'Noticia creada correctamente',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `newsId=${newsCreated.id}; type=${type}; title=${title}`,
        type: 'info'
      });

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
        return res.status(400).json({ message: 'ID de noticia invÃ¡lido.' });
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
        return res.status(400).json({ message: 'TÃ­tulo, fecha y descripciÃ³n son obligatorios.' });
      }

      const typeExists = await models.catalog.findOne({ where: { category: 'news_type', key: type, active: 'YES' } });
      if (!typeExists) {
        return res.status(400).json({ message: 'El tipo de noticia no es vÃ¡lido.' });
      }

      row.title = title;
      row.type = type;
      row.fecha = fecha;
      row.description = description;
      row.note = note || null;
      await row.save();

      await req.logAction({
        accion: 'Noticia actualizada correctamente',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `newsId=${row.id}; type=${type}; title=${title}`,
        type: 'info'
      });

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
        return res.status(400).json({ message: 'ID de noticia invÃ¡lido.' });
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
        return res.status(400).json({ message: 'No se recibiÃ³ ninguna imagen.' });
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

      await req.logAction({
        accion: 'Imagen de noticia actualizada',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `newsId=${row.id}; key=${key}`,
        type: 'info'
      });

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

      await req.logAction({
        accion: 'Noticia eliminada correctamente',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `newsId=${newsId}`,
        type: 'info'
      });

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

      const currentUserId = Number(req.user?.id) || 0;

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
            ) AS avatarUrl,
            (
              SELECT COUNT(*)
              FROM likes l
              WHERE l.target_type = 'news_comment' AND l.target_id = nc.id
            ) AS likesCount,
            (
              SELECT COUNT(*)
              FROM likes l
              WHERE l.target_type = 'news_comment' AND l.target_id = nc.id AND l.user_id = :currentUserId
            ) AS likedByCurrentUser
          FROM news_comments nc
          INNER JOIN Users u ON u.id = nc.user_id
          WHERE nc.news_id = :newsId
          ORDER BY nc.createdAt ASC, nc.id ASC
        `,
        {
          replacements: { newsId, currentUserId },
          type: db.QueryTypes.SELECT
        }
      );

      const parsed = comments.map((c) => ({
        ...c,
        likesCount: Number(c.likesCount || 0),
        likedByCurrentUser: Number(c.likedByCurrentUser) > 0,
      }));

      await req.logAction({
        accion: 'Comentarios de noticia consultados',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `newsId=${newsId}; comments=${parsed.length}`,
        type: 'info'
      });

      return res.status(200).json({ comments: parsed });
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

      await req.logAction({
        accion: 'Comentario de noticia creado',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `newsId=${newsId}; commentId=${created.id}`,
        type: 'info'
      });

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
          likesCount: 0,
          likedByCurrentUser: false,
        }
      });
    } catch (_error) {
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  toggleNewsLike = async (req, res) => {
    const tx = await db.transaction();
    try {
      const newsId = Number(req.params.id);
      if (!newsId) {
        await tx.rollback();
        return res.status(400).json({ message: 'ID de noticia invalido.' });
      }

      const userId = req.user?.id;
      if (!userId) {
        await tx.rollback();
        return res.status(401).json({ message: 'Usuario no autenticado.' });
      }

      const targetNews = await models.news.findByPk(newsId, {
        attributes: ['id'],
        transaction: tx,
        lock: tx.LOCK.UPDATE
      });

      if (!targetNews) {
        await tx.rollback();
        return res.status(404).json({ message: 'Noticia no encontrada.' });
      }

      const likeRow = await models.likes.findOne({
        where: { targetType: 'news', targetId: newsId, userId },
        transaction: tx,
        lock: tx.LOCK.UPDATE
      });

      const currentlyLiked = Boolean(likeRow);
      const nextLiked = !currentlyLiked;

      if (nextLiked) {
        if (!likeRow) {
          await models.likes.create({ targetType: 'news', targetId: newsId, userId }, { transaction: tx });
        }
      } else {
        if (likeRow) {
          await likeRow.destroy({ transaction: tx });
        }
      }

      // Contar likes actuales
      const likesCount = await models.likes.count({ where: { targetType: 'news', targetId: newsId }, transaction: tx });

      await tx.commit();

      await req.logAction({
        accion: nextLiked ? 'Like agregado a noticia' : 'Like removido de noticia',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `newsId=${newsId}; likesCount=${likesCount}`,
        type: 'info'
      });

      return res.status(200).json({
        newsId,
        liked: nextLiked,
        likesCount
      });
    } catch (_error) {
      await tx.rollback();
      if (_error instanceof LikesValidationError) {
        return res.status(400).json({ message: _error.message });
      }
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  toggleCommentLike = async (req, res) => {
    const tx = await db.transaction();
    try {
      const newsId = Number(req.params.id);
      const commentId = Number(req.params.commentId);
      if (!newsId || !commentId) {
        await tx.rollback();
        return res.status(400).json({ message: 'ID invalido.' });
      }

      const userId = req.user?.id;
      if (!userId) {
        await tx.rollback();
        return res.status(401).json({ message: 'Usuario no autenticado.' });
      }

      const commentRow = await models.news_comments.findOne({
        where: { id: commentId, newsId },
        attributes: ['id'],
        transaction: tx,
        lock: tx.LOCK.UPDATE
      });

      if (!commentRow) {
        await tx.rollback();
        return res.status(404).json({ message: 'Comentario no encontrado.' });
      }

      const likeRow = await models.likes.findOne({
        where: { targetType: 'news_comment', targetId: commentId, userId },
        transaction: tx,
        lock: tx.LOCK.UPDATE
      });

      const currentlyLiked = Boolean(likeRow);
      const nextLiked = !currentlyLiked;

      if (nextLiked) {
        if (!likeRow) {
          await models.likes.create({ targetType: 'news_comment', targetId: commentId, userId }, { transaction: tx });
        }
      } else {
        if (likeRow) {
          await likeRow.destroy({ transaction: tx });
        }
      }

      const likesCount = await models.likes.count({
        where: { targetType: 'news_comment', targetId: commentId },
        transaction: tx
      });

      await tx.commit();

      await req.logAction({
        accion: nextLiked ? 'Like agregado a comentario de noticia' : 'Like removido de comentario de noticia',
        apartado: 'News',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `newsId=${newsId}; commentId=${commentId}; likesCount=${likesCount}`,
        type: 'info'
      });

      return res.status(200).json({ commentId, liked: nextLiked, likesCount });
    } catch (_error) {
      await tx.rollback();
      if (_error instanceof LikesValidationError) {
        return res.status(400).json({ message: _error.message });
      }
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}

const ctrlNews = new NewsController();
export { ctrlNews };

