import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import handleError from '../../handlers/handleError.js';
import { models } from '../../models/index.js';

class StreamerController {
  s3 = () => {
    return new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
      },
    });
  };

  getPublicBase = () => {
    return process.env.R2_PUBLIC_URL
      ? process.env.R2_PUBLIC_URL.replace(/\/$/, '')
      : `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`.replace(/\/$/, '');
  };

  deleteByPublicUrl = async (url) => {
    const imageUrl = String(url || '');
    const publicBase = process.env.R2_PUBLIC_URL
      ? process.env.R2_PUBLIC_URL.replace(/\/$/, '')
      : '';

    if (!publicBase || !imageUrl.startsWith(publicBase)) return;

    const key = imageUrl.slice(publicBase.length + 1);
    if (!key) return;

    await this.s3().send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    }));
  };

  uploadImage = async (file, userId) => {
    const extByMime = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    const extension = extByMime[file.mimetype] || 'webp';
    const folder = process.env.R2_FOLDER || 'tdt3';
    const key = `${folder}/streamers/${userId}/streamer_${Date.now()}.${extension}`;

    await this.s3().send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return `${this.getPublicBase()}/${key}`;
  };

  getMyStreamer = async (req, res) => {
    try {
      const userID = req.user?.id;
      if (!userID) return res.status(401).json({ message: 'Usuario no autenticado' });

      const streamer = await models.streamer.findOne({ where: { userID } });
      await req.logAction({
        accion: 'Perfil de streamer consultado',
        apartado: 'Streamer',
        userId: userID,
        username: req.user?.username,
        valor: `hasProfile=${Boolean(streamer)}`,
        type: 'info'
      });
      return res.status(200).json({ streamer });
    } catch (error) {
      return handleError(res, req, error, 'Error al cargar perfil de streamer');
    }
  };

  upsertMyStreamer = async (req, res) => {
    try {
      const userID = req.user?.id;
      if (!userID) return res.status(401).json({ message: 'Usuario no autenticado' });

      const link = String(req.body?.link || '').trim();
      const communityName = String(req.body?.communityName || '').trim();
      const imageInput = String(req.body?.image || '').trim();

      if (!link || !communityName) {
        return res.status(400).json({ message: 'Link y nombre de comunidad son obligatorios.' });
      }

      let current = await models.streamer.findOne({ where: { userID } });
      let image = current?.image || null;

      if (req.file) {
        const nextImage = await this.uploadImage(req.file, userID);
        if (image && image !== nextImage) {
          await this.deleteByPublicUrl(image);
        }
        image = nextImage;
      } else if (imageInput) {
        image = imageInput;
      }

      if (!current) {
        current = await models.streamer.create({
          userID,
          link,
          platform: null,
          username: null,
          image,
          communityName,
        });

        await req.logAction({
          accion: 'Perfil de streamer creado',
          apartado: 'Streamer',
          userId: userID,
          username: req.user?.username,
          valor: `streamerId=${current.id}; communityName=${communityName}`,
          type: 'info'
        });

        return res.status(201).json({ message: 'Perfil de streamer creado correctamente.', streamer: current });
      }

      await current.update({
        link,
        platform: null,
        username: null,
        image,
        communityName,
      });

      await req.logAction({
        accion: 'Perfil de streamer actualizado',
        apartado: 'Streamer',
        userId: userID,
        username: req.user?.username,
        valor: `streamerId=${current.id}; communityName=${communityName}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Perfil de streamer actualizado correctamente.', streamer: current });
    } catch (error) {
      return handleError(res, req, error, 'Error al guardar perfil de streamer');
    }
  };
}

const ctrlStreamer = new StreamerController();
export { ctrlStreamer };
