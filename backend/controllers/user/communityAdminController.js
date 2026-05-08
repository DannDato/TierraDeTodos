import { models, db } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const getManagedCommunity = async (userId) => models.community.findOne({
  where: { lider: userId },
});

const getUserMembership = async (userId, transaction) => models.user_community.findOne({
  where: { userId },
  transaction,
});

const deleteS3Object = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
      },
    });

    const urlObj = new URL(fileUrl);
    const pathname = urlObj.pathname;
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    }));
  } catch (error) {
    console.error(`Error deleting S3 object (${fileUrl}):`, error.message);
  }
};

class CommunityAdminController {
  async getManageRequests(req, res) {
    try {
      const userId = req.user.id;
      const community = await getManagedCommunity(userId);

      if (!community) {
        return res.status(404).json({ message: 'No tienes comunidad registrada.' });
      }

      const requests = await models.user_community_request.findAll({
        where: {
          communityId: community.id,
          status: 'PENDING'
        },
        include: [
          {
            model: models.Users,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['requestedAt', 'ASC']]
      });

      const formattedRequests = requests.map((request) => ({
        id: request.id,
        userId: request.userId,
        communityId: request.communityId,
        status: request.status,
        requestedAt: request.requestedAt,
        reviewedAt: request.reviewedAt,
        username: request.user?.username || null,
        email: request.user?.email || null,
      }));

      await req.logAction({
        accion: 'Solicitudes pendientes de comunidad consultadas',
        apartado: 'CommunityAdmin',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communityId=${community.id}; requests=${formattedRequests.length}`,
        type: 'info'
      });

      return res.status(200).json({ requests: formattedRequests });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener las solicitudes pendientes de la comunidad');
    }
  }

  async approveRequest(req, res) {
    try {
      const reviewerId = req.user.id;
      const { requestId } = req.params;
      const community = await getManagedCommunity(reviewerId);

      if (!community) {
        return res.status(404).json({ message: 'No tienes comunidad registrada.' });
      }

      const request = await models.user_community_request.findOne({
        where: {
          id: requestId,
          communityId: community.id,
          status: 'PENDING'
        }
      });

      if (!request) {
        return res.status(404).json({ message: 'La solicitud no existe o ya fue procesada.' });
      }

      await db.transaction(async (transaction) => {
        const userMembership = await getUserMembership(request.userId, transaction);
        if (userMembership && Number(userMembership.communityId) !== Number(community.id)) {
          throw new Error('El usuario ya pertenece a otra comunidad.');
        }

        const userLeadsAnotherCommunity = await models.community.findOne({
          where: { lider: request.userId },
          transaction,
        });

        if (userLeadsAnotherCommunity && Number(userLeadsAnotherCommunity.id) !== Number(community.id)) {
          throw new Error('No se puede aprobar la solicitud porque el usuario lidera otra comunidad.');
        }

        if (!userMembership) {
          await models.user_community.create(
            {
              userId: request.userId,
              communityId: community.id
            },
            { transaction }
          );
        }

        await request.update({
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewerId
        }, { transaction });
      });

      await req.logAction({
        accion: 'Solicitud de comunidad aprobada',
        apartado: 'CommunityAdmin',
        userId: reviewerId,
        username: req.user?.username,
        valor: `communityId=${community.id}; requestId=${request.id}; targetUserId=${request.userId}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Solicitud aprobada correctamente.' });
    } catch (error) {
      if (
        error?.message === 'El usuario ya pertenece a otra comunidad.'
        || error?.message === 'No se puede aprobar la solicitud porque el usuario lidera otra comunidad.'
      ) {
        return res.status(409).json({ message: error.message });
      }
      handleError(res, req, error, 'Error al aprobar la solicitud de comunidad');
    }
  }

  async rejectRequest(req, res) {
    try {
      const reviewerId = req.user.id;
      const { requestId } = req.params;
      const community = await getManagedCommunity(reviewerId);

      if (!community) {
        return res.status(404).json({ message: 'No tienes comunidad registrada.' });
      }

      const request = await models.user_community_request.findOne({
        where: {
          id: requestId,
          communityId: community.id,
          status: 'PENDING'
        }
      });

      if (!request) {
        return res.status(404).json({ message: 'La solicitud no existe o ya fue procesada.' });
      }

      await db.transaction(async (transaction) => {
        await request.update({
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: reviewerId
        }, { transaction });
      });

      await req.logAction({
        accion: 'Solicitud de comunidad rechazada',
        apartado: 'CommunityAdmin',
        userId: reviewerId,
        username: req.user?.username,
        valor: `communityId=${community.id}; requestId=${request.id}; targetUserId=${request.userId}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Solicitud rechazada correctamente.' });
    } catch (error) {
      handleError(res, req, error, 'Error al rechazar la solicitud de comunidad');
    }
  }

  async removeMember(req, res) {
    try {
      const leaderId = req.user.id;
      const memberId = Number(req.params.memberId);

      if (!Number.isInteger(memberId) || memberId <= 0) {
        return res.status(400).json({ message: 'ID de miembro invÃ¡lido.' });
      }

      const community = await getManagedCommunity(leaderId);

      if (!community) {
        return res.status(404).json({ message: 'No tienes comunidad registrada.' });
      }

      if (memberId === community.lider) {
        return res.status(400).json({ message: 'No puedes sacar al lÃ­der de la comunidad.' });
      }

      const membership = await models.user_community.findOne({
        where: {
          userId: memberId,
          communityId: community.id
        }
      });

      if (!membership) {
        return res.status(404).json({ message: 'El usuario no pertenece a tu comunidad.' });
      }

      await membership.destroy();

      await req.logAction({
        accion: 'Miembro removido de comunidad',
        apartado: 'CommunityAdmin',
        userId: leaderId,
        username: req.user?.username,
        valor: `communityId=${community.id}; memberId=${memberId}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Miembro removido correctamente.' });
    } catch (error) {
      handleError(res, req, error, 'Error al sacar miembro de la comunidad');
    }
  }

  async create(req, res) {
    try {
      const userId = req.user.id;
      const { platform, streamerUsername, streamerLink, streamerImage, communityName, shortname, color, color2, description, logo_url } = req.body;

      if (!communityName || typeof communityName !== 'string' || communityName.trim().length === 0 || communityName.length > 100) {
        return res.status(400).json({ message: 'Nombre de comunidad invÃ¡lido (mÃ¡ximo 100 caracteres).' });
      }
      if (!shortname || typeof shortname !== 'string' || shortname.trim().length === 0 || shortname.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(shortname)) {
        return res.status(400).json({ message: 'Nombre corto invÃ¡lido (solo alfanumÃ©ricos, guiones y guiones bajos, mÃ¡ximo 50 caracteres).' });
      }
      if (!color || typeof color !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        return res.status(400).json({ message: 'Color primario invÃ¡lido (debe ser un valor hex como #FFFFFF).' });
      }
      if (!color2 || typeof color2 !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color2)) {
        return res.status(400).json({ message: 'Color secundario invÃ¡lido (debe ser un valor hex como #222222).' });
      }
      if (description && (typeof description !== 'string' || description.length > 500)) {
        return res.status(400).json({ message: 'DescripciÃ³n demasiado larga (mÃ¡ximo 500 caracteres).' });
      }

      const existingMembership = await getUserMembership(userId);
      let community = await models.community.findOne({ where: { lider: userId } });

      if (!community && existingMembership) {
        return res.status(409).json({ message: 'No puedes crear una comunidad porque ya perteneces a otra.' });
      }

      if (community && existingMembership && Number(existingMembership.communityId) !== Number(community.id)) {
        return res.status(409).json({ message: 'Tu cuenta estÃ¡ asociada a otra comunidad. Contacta a soporte.' });
      }

      let streamer = await models.streamer.findOne({ where: { userID: userId } });
      if (!streamer) {
        streamer = await models.streamer.create({
          userID: userId,
          platform,
          username: streamerUsername,
          link: streamerLink,
          image: streamerImage
        });
      } else {
        await streamer.update({ platform, username: streamerUsername, link: streamerLink, image: streamerImage });
      }

      if (community) {
        if (community.lider !== userId) {
          return res.status(403).json({ message: 'No tienes permiso para actualizar esta comunidad.' });
        }

        if (logo_url && community.logo_url && logo_url !== community.logo_url) {
          await deleteS3Object(community.logo_url);
        }

        await community.update({
          name: communityName,
          shortname,
          color,
          color2,
          description,
          logo_url
        });

        if (!existingMembership) {
          await models.user_community.create({ userId, communityId: community.id });
        }

        await req.logAction({
          accion: 'Comunidad actualizada por lider',
          apartado: 'CommunityAdmin',
          userId,
          username: req.user?.username,
          valor: `communityId=${community.id}; shortname=${shortname}`,
          type: 'info'
        });

        return res.status(200).json({ message: 'Comunidad actualizada correctamente', community });
      }

      community = await models.community.create({
        name: communityName,
        shortname,
        lider: userId,
        color,
        color2,
        description,
        logo_url
      });

      const joinLeaderToCommunity = await models.user_community.create({
        userId,
        communityId: community.id
      });

      if (!joinLeaderToCommunity) {
        console.warn(`No se pudo unir al lÃ­der ${userId} a su comunidad ${community.id}`);
      }

      await req.logAction({
        accion: 'Comunidad creada correctamente',
        apartado: 'CommunityAdmin',
        userId,
        username: req.user?.username,
        valor: `communityId=${community.id}; shortname=${shortname}`,
        type: 'info'
      });

      return res.status(201).json({ message: 'Comunidad creada correctamente', community });
    } catch (error) {
      handleError(res, req, error, 'Error al crear comunidad');
    }
  }

  async uploadCommunityLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se subiÃ³ ningÃºn archivo.' });
      }

      const userId = req.user?.id || 'unknown';
      const extByMime = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };
      const extension = extByMime[req.file.mimetype] || 'webp';
      const folder = process.env.R2_FOLDER || 'tdt-system';
      const key = `${folder}/communities/${userId}/logo_${Date.now()}.${extension}`;

      const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY,
          secretAccessKey: process.env.R2_SECRET_KEY,
        },
      });

      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));

      const url = (process.env.R2_PUBLIC_URL
        ? process.env.R2_PUBLIC_URL.replace(/\/$/, '')
        : `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`.replace(/\/$/, '')) + `/${key}`;

      await req.logAction({
        accion: 'Logo de comunidad subido',
        apartado: 'CommunityAdmin',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `key=${key}`,
        type: 'info'
      });

      return res.status(201).json({ url });
    } catch (error) {
      handleError(res, req, error, 'Error al subir logo de la comunidad');
    }
  }
}

export const communityAdminController = new CommunityAdminController();
