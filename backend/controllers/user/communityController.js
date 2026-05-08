import { models, db } from '../../models/index.js';
import { QueryTypes } from 'sequelize';
import handleError from '../../handlers/handleError.js';

const getManagedCommunity = async (userId) => models.community.findOne({
  where: { lider: userId },
});

const getUserMembership = async (userId, transaction) => models.user_community.findOne({
  where: { userId },
  transaction,
});

class CommunityController {
  async canManage(req, res) {
    try {
      const canManage = req.user.permissions && req.user.permissions.includes('community.manage');
      await req.logAction({
        accion: 'Consulta de permiso de gestion de comunidad',
        apartado: 'Community',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `canManage=${!!canManage}`,
        type: 'info'
      });
      return res.status(200).json({ canManage: !!canManage });
    } catch (error) {
      handleError(res, req, error, 'Error al verificar permisos de gestiÃ³n de comunidad');
    }
  }

  async getMembers(req, res) {
    try {
      const userId = req.user.id;
      const community = await getManagedCommunity(userId);
      if (!community) return res.status(404).json({ message: 'No tienes comunidad registrada.' });

      const userCommunities = await models.user_community.findAll({
        where: { communityId: community.id },
        limit: 100,
        offset: 0,
        include: [
          {
            model: models.Users,
            as: 'user',
            attributes: ['id', 'username', 'role']
          }
        ]
      });

      const members = userCommunities.map((uc) => {
        const u = uc.user;
        return {
          id: u.id,
          username: u.username,
          role: u.role,
          isLeader: u.id === community.lider
        };
      });

      await req.logAction({
        accion: 'Miembros de comunidad consultados',
        apartado: 'Community',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communityId=${community.id}; members=${members.length}`,
        type: 'info'
      });

      return res.status(200).json({ members });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener miembros de la comunidad');
    }
  }

  async getMyCommunity(req, res) {
    try {
      const userId = req.user.id;
      const userCommunity = await models.user_community.findOne({
        where: { userId },
        order: [['joinedAt', 'DESC'], ['id', 'DESC']],
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
        return res.status(200).json({ message: 'No tienes comunidad registrada.', community: null });
      }

      const c = userCommunity.community;
      const leader = c.leader || {};
      const streamer = leader.streamer || {};
      const profileImages = Array.isArray(leader.profileImages) && leader.profileImages.length > 0 ? leader.profileImages[0] : {};

      const communityMemberships = await models.user_community.findAll({
        where: { communityId: c.id },
        limit: 100,
        offset: 0,
        include: [
          {
            model: models.Users,
            as: 'user',
            attributes: ['id', 'username'],
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
        username: membership.user?.username || 'N/A',
        isLeader: Number(membership.user?.id) === Number(c.lider),
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

      await req.logAction({
        accion: 'Comunidad actual consultada',
        apartado: 'Community',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communityId=${c.id}; members=${members.length}`,
        type: 'info'
      });

      return res.status(200).json({ community: result });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener tu comunidad');
    }
  }

  async getAll(req, res) {
    try {
      const communities = await models.community.findAll({
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
                as: 'profileImage',
                attributes: ['img']
              }
            ]
          }
        ],
        order: [['name', 'ASC']],
        distinct: true
      });

      const communityIds = communities.map((community) => community.id);
      const memberRows = communityIds.length
        ? await db.query(
            `
              SELECT uc.communityId, u.id as userId, u.username, upi.img as profileImage
              FROM user_community uc
              JOIN Users u ON uc.userId = u.id
              LEFT JOIN user_profile_images upi ON u.id = upi.userId
              WHERE uc.communityId IN (:communityIds)
            `,
            {
              replacements: { communityIds },
              type: QueryTypes.SELECT,
            }
          )
        : [];

      const membersByCommunity = memberRows.reduce((acc, row) => {
        const communityId = Number(row.communityId);
        if (!acc[communityId]) {
          acc[communityId] = [];
        }

        acc[communityId].push({
          id: row.userId,
          username: row.username,
          profileImage: row.profileImage || null,
        });

        return acc;
      }, {});

      const communitiesWithMembers = communities.map((c) => {
        const members = (membersByCommunity[Number(c.id)] || []).map((member) => ({
          ...member,
          isLeader: Number(member.id) === Number(c.lider),
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
          members
        };
      });

      const isManager = req.user.permissions && req.user.permissions.includes('community.manage');
      await req.logAction({
        accion: 'Listado de comunidades consultado',
        apartado: 'Community',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communities=${communitiesWithMembers.length}; isManager=${!!isManager}`,
        type: 'info'
      });
      return res.status(200).json({ communities: communitiesWithMembers, isManager });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener comunidades');
    }
  }

  async join(req, res) {
    try {
      const userId = req.user.id;
      const communityId = Number(req.params.id);

      if (!Number.isInteger(communityId) || communityId <= 0) {
        return res.status(400).json({ message: 'ID de comunidad invÃ¡lido.' });
      }

      const community = await models.community.findByPk(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Comunidad no encontrada.' });
      }

      const existingMembership = await getUserMembership(userId);
      if (existingMembership) {
        return res.status(409).json({ message: 'Ya perteneces a una comunidad.' });
      }

      const liderMembership = await models.community.findOne({
        where: { lider: userId }
      });
      if (liderMembership) {
        return res.status(400).json({ message: 'No puedes unirte a otra comunidad porque eres lÃ­der de una comunidad.' });
      }

      const existingPendingRequest = await models.user_community_request.findOne({
        where: { userId, status: 'PENDING' }
      });
      if (existingPendingRequest) {
        return res.status(409).json({ message: 'Ya tienes una solicitud pendiente de revisiÃ³n.' });
      }

      await models.user_community_request.create({ userId, communityId });
      await req.logAction({
        accion: 'Solicitud de ingreso a comunidad creada',
        apartado: 'Community',
        userId,
        username: req.user?.username,
        valor: `communityId=${communityId}`,
        type: 'info'
      });
      return res.status(201).json({ message: 'Tu solicitud fue enviada correctamente.' });
    } catch (error) {
      handleError(res, req, error, 'Error al unirse a la comunidad');
    }
  }

  async leave(req, res) {
    try {
      const userId = req.user.id;
      const communityId = Number(req.params.id);

      if (!Number.isInteger(communityId) || communityId <= 0) {
        return res.status(400).json({ message: 'ID de comunidad invÃ¡lido.' });
      }

      const community = await models.community.findByPk(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Comunidad no encontrada.' });
      }

      const membership = await models.user_community.findOne({ where: { userId, communityId } });
      if (!membership) {
        return res.status(400).json({ message: 'No eres miembro de esta comunidad.' });
      }

      if (community.lider === userId) {
        return res.status(400).json({ message: 'El lÃ­der no puede salir de la comunidad. Designa un nuevo lÃ­der primero.' });
      }

      await membership.destroy();
      await req.logAction({
        accion: 'Usuario abandono comunidad',
        apartado: 'Community',
        userId,
        username: req.user?.username,
        valor: `communityId=${communityId}`,
        type: 'info'
      });
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
        return res.status(400).json({ message: 'ID de solicitud invÃ¡lido.' });
      }

      const request = await models.user_community_request.findOne({
        where: {
          id: requestId,
          userId,
          status: 'PENDING'
        }
      });

      if (!request) {
        return res.status(404).json({ message: 'No se encontrÃ³ una solicitud pendiente para cancelar.' });
      }

      await request.update({
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: userId
      });

      await req.logAction({
        accion: 'Solicitud de comunidad cancelada',
        apartado: 'Community',
        userId,
        username: req.user?.username,
        valor: `requestId=${requestId}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Solicitud cancelada correctamente.' });
    } catch (error) {
      handleError(res, req, error, 'Error al cancelar solicitud de comunidad');
    }
  }

  async getRequests(req, res) {
    try {
      const userId = req.user.id;
      const request = await models.user_community_request.findOne({
        where: { userId, status: 'PENDING' },
      });

      await req.logAction({
        accion: 'Solicitud actual de comunidad consultada',
        apartado: 'Community',
        userId,
        username: req.user?.username,
        valor: `hasPendingRequest=${Boolean(request)}`,
        type: 'info'
      });

      return res.status(200).json({
        request: request || null,
        hasPendingRequest: Boolean(request)
      });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener las solicitudes de comunidad del usuario');
    }
  }
}

export const communityController = new CommunityController();

