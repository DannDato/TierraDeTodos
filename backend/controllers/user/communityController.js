import { models, db } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

class CommunityController {
  // GET /user/community/members
  async getMembers(req, res) {
    try {
      const userId = req.user.id;
      // Buscar la comunidad donde el usuario es líder
      const community = await models.community.findOne({
        where: { lider: userId },
      });
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
          role: u.role
        };
      });
      return res.status(200).json({ members });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener miembros de la comunidad');
    }
  }
    // GET /user/my-community
    async getMyCommunity(req, res) {
      try {
        const userId = req.user.id;
        const community = await models.community.findOne({
          where: { lider: userId },
          include: [
            {
              model: models.Users,
              as: 'leader',
              attributes: ['id', 'username', 'displayName', 'role'],
              include: [
                {
                  model: models.streamer,
                  as: 'streamer',
                  attributes: ['platform', 'username', 'link', 'image']
                },
                {
                  model: models.user_profile_images,
                  as: 'profileImage',
                  attributes: ['img']
                }
              ]
            }
          ]
        });
        if (!community) return res.status(404).json({ message: 'No tienes comunidad registrada.' });
        // Formatear igual que getAll
        const leader = community.leader || {};
        const streamer = leader.streamer || {};
        const profileImage = leader.profileImage || {};
        const result = {
          id: community.id,
          name: community.name,
          shortname: community.shortname,
          color: community.color,
          color2: community.color2,
          description: community.description,
          logo_url: community.logo_url,
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
          }
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
            attributes: ['id', 'username', 'displayName', 'role'],
            include: [
              {
                model: models.streamer,
                as: 'streamer',
                attributes: ['platform', 'username', 'link', 'image']
              },
              {
                model: models.user_profile_images,
                as: 'profileImage',
                attributes: ['img']
              }
            ]
          }
        ],
        order: [['name', 'ASC']]
      });
      // Obtener miembros para cada comunidad
      const communitiesWithMembers = await Promise.all(communities.map(async c => {
        // Busca los miembros de la comunidad
        const userCommunities = await models.user_community.findAll({
          where: { communityId: c.id },
          include: [
            {
              model: models.Users,
              as: 'user',
              attributes: ['id', 'username', 'account'],
              include: [
                {
                  model: models.user_profile_images,
                  as: 'profileImage',
                  attributes: ['img']
                },
                {
                  model: models.userStatuses,
                  as: 'statuses',
                  attributes: ['color', 'status'],
                  where: { status: db.col('user.account') }, // <-- esto filtra por el estatus actual
                  required: false
                }
              ]
            }
          ]
        });

        const members = userCommunities.map(uc => ({
          id: uc.user.id,
          username: uc.user.username,
          account: uc.user.account,
          profileImage: uc.user.profileImage ? uc.user.profileImage.img : null,
          statusColor: uc.user.statuses[0].color
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
  async getMyCommunity(req, res) {
    try {
      const userId = req.user.id;
      const community = await models.community.findOne({
        where: { lider: userId },
        include: [
          {
            model: models.Users,
            as: 'leader',
            attributes: ['id', 'username', 'displayName', 'role'],
            include: [
              {
                model: models.streamer,
                as: 'streamer',
                attributes: ['platform', 'username', 'link', 'image']
              },
              {
                model: models.user_profile_images,
                as: 'profileImage',
                attributes: ['img']
              }
            ]
          }
        ]
      });
      if (!community) return res.status(404).json({ message: 'No tienes comunidad registrada.' });
      // Formatear igual que getAll
      const leader = community.leader || {};
      const streamer = leader.streamer || {};
      const profileImage = leader.profileImage || {};
      const result = {
        id: community.id,
        name: community.name,
        shortname: community.shortname,
        color: community.color,
        description: community.description,
        logo_url: community.logo_url,
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
        }
      };
      return res.status(200).json({ community: result });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener tu comunidad');
    }
  }

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
      console.error('Error al subir logo a R2:', error);
      return res.status(500).json({ message: 'Error interno al subir el logo.' });
    }
  }
}

export const communityController = new CommunityController();
