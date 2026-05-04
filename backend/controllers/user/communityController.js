import { models, db } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const getManagedCommunity = async (userId) => models.community.findOne({
  where: { lider: userId },
});

class CommunityController {
  // GET /user/community/members

  async canManage(req, res) {
    try {
      const canManage = req.user.permissions && req.user.permissions.includes('community.manage');
      return res.status(200).json({ canManage: !!canManage });
    } catch (error) {
      handleError(res, req, error, 'Error al verificar permisos de gestión de comunidad');
    }
  }

  async getMembers(req, res) {
    try {
      const userId = req.user.id;
      // Buscar la comunidad donde el usuario es líder
      const community = await getManagedCommunity(userId);
      if (!community) return res.status(404).json({ message: 'No tienes comunidad registrada.' });

      // Buscar miembros de la comunidad
      const userCommunities = await models.user_community.findAll({
        where: { communityId: community.id },
        include: [
          {
            model: models.Users,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'role']
          }
        ]
      });

      // Formatear respuesta
      const members = userCommunities.map(uc => {
        const u = uc.user;
        return {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          isLeader: u.id === community.lider
        };
      });
      return res.status(200).json({ members });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener miembros de la comunidad');
    }
  }

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
            attributes: ['id', 'username', 'displayName', 'email']
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
        displayName: request.user?.displayName || null,
        email: request.user?.email || null,
      }));

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
        const existingMembership = await models.user_community.findOne({
          where: {
            userId: request.userId,
            communityId: community.id
          },
          transaction
        });

        if (!existingMembership) {
          await models.user_community.create({
            userId: request.userId,
            communityId: community.id
          }, { transaction });
        }

        await request.update({
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewerId
        }, { transaction });
      });

      return res.status(200).json({ message: 'Solicitud aprobada correctamente.' });
    } catch (error) {
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

      await request.update({
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: reviewerId
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
      const community = await getManagedCommunity(leaderId);

      if (!community) {
        return res.status(404).json({ message: 'No tienes comunidad registrada.' });
      }

      if (memberId === community.lider) {
        return res.status(400).json({ message: 'No puedes sacar al líder de la comunidad.' });
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

      return res.status(200).json({ message: 'Miembro removido correctamente.' });
    } catch (error) {
      handleError(res, req, error, 'Error al sacar miembro de la comunidad');
    }
  }
    // GET /user/my-community
    async getMyCommunity(req, res) {
      try {
        const userId = req.user.id;
        // Obtener la comunidad donde el usuario es miembro
        const userCommunity = await models.user_community.findOne({
          where: { userId },
          include: [
            {
              model: models.community,
              as: 'community',
              include: [
                {
                  model: models.Users,
                  as: 'leader',
                  include: [
                    {
                      model: models.streamer,
                      as: 'streamer',
                    },
                    {
                      model: models.user_profile_images,
                      as: 'profileImages',
                    }
                  ]
                }
              ]
            }
          ]
        });

        if (!userCommunity || !userCommunity.community) {
          return res.status(204).json({ message: 'No tienes comunidad registrada.' });
        }

        const c = userCommunity.community;
        const leader = c.leader || {};
        const streamer = leader.streamer || {};
        const profileImages = Array.isArray(leader.profileImages) && leader.profileImages.length > 0 ? leader.profileImages[0] : {};

        const communityMemberships = await models.user_community.findAll({
          where: { communityId: c.id },
          include: [
            {
              model: models.Users,
              as: 'user',
              attributes: ['id', 'username', 'displayName'],
              include: [
                {
                  model: models.user_profile_images,
                  as: 'profileImages',
                  attributes: ['img']
                }
              ]
            }
          ]
        });

        const members = communityMemberships.map((membership) => ({
          id: membership.user?.id,
          nombre: membership.user?.username || membership.user?.displayName || 'N/A',
          profileImage: Array.isArray(membership.user?.profileImages) && membership.user.profileImages.length > 0
            ? membership.user.profileImages[0].img
            : null
        }));

        const result = {
          id: c.id,
          name: c.name,
          shortname: c.shortname,
          color: c.color,
          color2: c.color2,
          description: c.description,
          logo_url: c.logo_url,
          leader: {
            id: leader.id,
            username: leader.username,
            displayName: leader.displayName,
            role: leader.role,
            profileImage: profileImages?.img || null,
            streamer: {
              platform: streamer?.platform || null,
              username: streamer?.username || null,
              link: streamer?.link || null,
              image: streamer?.image || null
            }
          },
          members
        };
        return res.status(200).json({ community: result });
      } catch (error) {
        handleError(res, req, error, 'Error al obtener tu comunidad');
      }
    }
  // GET /user/communities
  async getAll(req, res) {
    try {
      const communities = await models.community.findAll({
        include: [
          {
            model: models.Users,
            as: 'leader',
            // attributes: ['id', 'username', 'displayName', 'role', 'logo_url'],
            include: [
              {
                model: models.streamer,
                as: 'streamer',
                // attributes: ['platform', 'username', 'link', 'image']
              },
              {
                model: models.user_profile_images,
                as: 'profileImage',
                attributes: ['img']
              }
            ]
          }
        ],
        order: [['name', 'ASC']],
        group: ['community.id']
      });
      // Obtener miembros para cada comunidad
      const communitiesWithMembers = await Promise.all(communities.map(async c => {
        // Busca los miembros de la comunidad
        // const userCommunities = await models.user_community.findAll({
        //   where: { communityId: c.id },
        //   include: [{ model: models.Users, as: 'user', attributes: ['id', 'username'] }]
        // });
        const [userCommunities] = await db.query(`
          SELECT uc.*, u.id as userId, u.username, upi.img as profileImage
          FROM user_community uc
          JOIN Users u ON uc.userId = u.id
          LEFT JOIN user_profile_images upi ON u.id = upi.userId
          WHERE uc.communityId = ${c.id}
        `)

        const members = userCommunities.map(uc => ({
          id: uc.userId,
          nombre: uc.username,
          profileImage: uc.profileImage || null
        }));
        const leader = c.leader || {};
        const streamer = leader.streamer || {};
        const profileImage = leader.profileImage || {};
        return {
          id: c.id,
          name: c.name,
          shortname: c.shortname,
          color: c.color,
          color2: c.color2,
          description: c.description,
          logo_url: c.logo_url,
          leader: {
            id: leader.id,
            username: leader.username,
            displayName: leader.displayName,
            role: leader.role,
            profileImage: profileImage.img || null,
            streamer: {
              platform: streamer.platform,
              username: streamer.username,
              link: streamer.link,
              image: streamer.image
            }
          },
          members: members
        };
      }));
      const isManager = req.user.permissions && req.user.permissions.includes('community.manage');
      return res.status(200).json({ communities: communitiesWithMembers, isManager });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener comunidades');
    }
  }

  // GET /user/my-community


  // POST /user/communities
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { platform, streamerUsername, streamerLink, streamerImage, communityName, shortname, color, color2, description, logo_url } = req.body;

      // Buscar si ya existe comunidad
      let community = await models.community.findOne({ where: { lider: userId } });

      // Crear o actualizar streamer
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
        // Actualizar comunidad existente
        await community.update({
          name: communityName,
          shortname,
          color,
          color2,
          description,
          logo_url
        });
        return res.status(200).json({ message: 'Comunidad actualizada correctamente', community });
      } else {
        // Crear nueva comunidad
        community = await models.community.create({
          name: communityName,
          shortname,
          lider: userId,
          color,
          color2,
          description,
          logo_url
        });
        let joinLeaderToCommunity = await models.user_community.create({
          userId,
          communityId: community.id
        });
        if(!joinLeaderToCommunity) {
          console.warn(`No se pudo unir al líder ${userId} a su comunidad ${community.id}`);
        }
        return res.status(201).json({ message: 'Comunidad creada correctamente', community });
      }
    } catch (error) {
      handleError(res, req, error, 'Error al crear comunidad');
    }
  }

  // POST /user/communities/logo
  async uploadCommunityLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo.' });
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

      return res.status(201).json({ url });
    } catch (error) {
      handleError(res, req, error, 'Error al subir logo de la comunidad');
    }
  }

  async join(req, res) {
    try {
      const userId = req.user.id;
      const communityId = req.params.id;
      // Verificar que la comunidad exista
      const community = await models.community.findByPk(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Comunidad no encontrada.' });
      }
      // Verificar si el usuario ya es miembro
      const existingMembership = await models.user_community.findOne({
        where: { userId, communityId }
      });
      if (existingMembership) {
        return res.status(400).json({ message: 'El usuario ya es miembro de la comunidad.' });
      }
      // verificar si el usuario es líder de otra comunidad
      const liderMembership = await models.community.findOne({
        where: { lider: userId }
      });
      if (liderMembership) {
        return res.status(400).json({ message: 'No puedes unirte a otra comunidad porque eres líder de una comunidad.' });
      }
      const existingPendingRequest = await models.user_community_request.findOne({
        where: { userId, status: 'PENDING' }
      });
      if (existingPendingRequest) {
        return res.status(400).json({ message: 'Ya tienes una solicitud pendiente de revisión.' });
      }
      // Unirse a la comunidad
      await models.user_community_request.create({ userId, communityId });
      return res.status(200).json({ message: 'Tu solicitud fue enviada correctamente.' });

    } catch (error) {
      handleError(res, req, error, 'Error al unirse a la comunidad');
    }
  }
  async leave(req, res) {
    try {
      const userId = req.user.id;
      const communityId = req.params.id;
      // Verificar que la comunidad exista
      const community = await models.community.findByPk(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Comunidad no encontrada.' });
      }
      // Verificar si el usuario es miembro
      const membership = await models.user_community.findOne({
        where: { userId, communityId }
      });
      if (!membership) {
        return res.status(400).json({ message: 'No eres miembro de esta comunidad.' });
      }
      // Verificar si el usuario es líder
      if (community.lider === userId) {
        return res.status(400).json({ message: 'No puedes salir de la comunidad porque eres el líder' });
      }
      // Salir de la comunidad
      await membership.destroy();
      return res.status(200).json({ message: 'Has salido de la comunidad correctamente.' });
    } catch (error) {
      handleError(res, req, error, 'Error al dejar la comunidad');
    }
  }

  async cancelRequest(req, res) {
    try {
      const userId = req.user.id;
      const requestId = Number(req.params.requestId);

      if (!Number.isInteger(requestId) || requestId <= 0) {
        return res.status(400).json({ message: 'ID de solicitud inválido.' });
      }

      const request = await models.user_community_request.findOne({
        where: {
          id: requestId,
          userId,
          status: 'PENDING'
        }
      });

      if (!request) {
        return res.status(404).json({ message: 'No se encontró una solicitud pendiente para cancelar.' });
      }

      await request.destroy();

      return res.status(200).json({ message: 'Solicitud cancelada correctamente.' });
    } catch (error) {
      handleError(res, req, error, 'Error al cancelar solicitud de comunidad');
    }
  }

  async getRequests(req, res) {
    try {
      const userId = req.user.id;
      // verificar si el usuario pertenece a una comunidad
      const requestedCommunity = await models.user_community_request.findOne({
        where: { userId, status: 'PENDING' },
      });
      if (!requestedCommunity) {
        return res.status(200).json({ message: 'No tienes solicitudes de comunidad.', value:false });
      }
      return res.status(200).json({ requests: requestedCommunity, value:true });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener las solicitudes de comunidad del usuario');
    }
  }

}

export const communityController = new CommunityController();
