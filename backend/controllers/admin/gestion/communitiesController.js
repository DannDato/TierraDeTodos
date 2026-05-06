import { models, db } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Op } from 'sequelize';

const normalizeText = (value) => String(value || '').trim();

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
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  } catch (error) {
    console.error(`Error deleting S3 object (${fileUrl}):`, error.message);
  }
};

class CommunitiesAdminController {
  getAll = async (req, res) => {
    try {
      const communities = await models.community.findAll({
        include: [
          {
            model: models.Users,
            as: 'leader',
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['name', 'ASC']],
      });

      return res.status(200).json({
        communities: communities.map((c) => ({
          id: c.id,
          name: c.name,
          shortname: c.shortname,
          description: c.description,
          color: c.color,
          color2: c.color2,
          logo_url: c.logo_url,
          lider: c.lider,
          leaderUsername: c.leader?.username || null,
          createdAt: c.createdAt,
        })),
      });

      await req.logAction({
        accion: 'Comunidades de gestion consultadas',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communities=${communities.length}`,
        type: 'info'
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al cargar comunidades');
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      const communityId = Number(id);
      if (!Number.isInteger(communityId) || communityId <= 0) {
        return res.status(400).json({ message: 'ID de comunidad invÃ¡lido.' });
      }

      const community = await models.community.findByPk(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Comunidad no encontrada.' });
      }

      const name = normalizeText(req.body?.name);
      const description = normalizeText(req.body?.description);
      const logo_url = normalizeText(req.body?.logo_url) || null;

      if (!name) {
        return res.status(400).json({ message: 'El nombre es obligatorio.' });
      }
      if (name.length > 100) {
        return res.status(400).json({ message: 'El nombre no puede superar 100 caracteres.' });
      }

      // If logo changed and old one is an S3 URL, remove it
      if (logo_url && community.logo_url && logo_url !== community.logo_url) {
        await deleteS3Object(community.logo_url);
      }

      await community.update({ name, description, logo_url });

      await req.logAction({
        accion: 'Comunidad actualizada desde gestion',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communityId=${community.id}; name=${name}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Comunidad actualizada correctamente.' });
    } catch (error) {
      return handleError(res, req, error, 'Error al actualizar comunidad');
    }
  };

  removeLogo = async (req, res) => {
    try {
      const communityId = Number(req.params.id);
      if (!Number.isInteger(communityId) || communityId <= 0) {
        return res.status(400).json({ message: 'ID de comunidad invÃ¡lido.' });
      }

      const community = await models.community.findByPk(communityId);
      if (!community) return res.status(404).json({ message: 'Comunidad no encontrada.' });

      if (community.logo_url) {
        await deleteS3Object(community.logo_url);
        await community.update({ logo_url: null });
      }

      await req.logAction({
        accion: 'Logo de comunidad eliminado desde gestion',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communityId=${community.id}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Logo eliminado correctamente.' });
    } catch (error) {
      return handleError(res, req, error, 'Error al eliminar logo');
    }
  };

  getMemberOptions = async (req, res) => {
    try {
      const [roles, statuses] = await Promise.all([
        models.Roles.findAll({ attributes: ['id', 'role', 'detail', 'color'], order: [['role', 'ASC']] }),
        models.system_statuses.findAll({
          attributes: ['id', 'status', 'detail', 'color'],
          where: { active: true, asignable: 'YES' },
          order: [['status', 'ASC']],
        }),
      ]);
      await req.logAction({
        accion: 'Opciones de miembros de comunidad consultadas',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `roles=${roles.length}; statuses=${statuses.length}`,
        type: 'info'
      });
      return res.status(200).json({ roles, statuses });
    } catch (error) {
      return handleError(res, req, error, 'Error al cargar opciones de miembros');
    }
  };

  bulkAction = async (req, res) => {
    try {
      const communityId = Number(req.params.id);
      if (!Number.isInteger(communityId) || communityId <= 0) {
        return res.status(400).json({ message: 'ID de comunidad invÃ¡lido.' });
      }

      const community = await models.community.findByPk(communityId);
      if (!community) return res.status(404).json({ message: 'Comunidad no encontrada.' });

      const { role, status } = req.body || {};
      if (!role && !status) {
        return res.status(400).json({ message: 'Debes especificar un rol o un estatus para aplicar.' });
      }

      // Collect all member user IDs
      const memberships = await models.user_community.findAll({
        where: { communityId },
        attributes: ['userId'],
      });
      const userIds = memberships.map((m) => m.userId);

      if (userIds.length === 0) {
        return res.status(200).json({ message: 'La comunidad no tiene miembros.', affected: 0 });
      }

      const updates = {};
      if (role) updates.role = String(role).trim().toUpperCase();
      if (status) updates.account = String(status).trim().toUpperCase();

      const [affected] = await models.Users.update(updates, {
        where: { id: { [Op.in]: userIds } },
      });

      await req.logAction({
        accion: 'Accion masiva aplicada a comunidad',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communityId=${communityId}; affected=${affected}; role=${updates.role || ''}; status=${updates.account || ''}`,
        type: 'info'
      });

      return res.status(200).json({
        message: `AcciÃ³n aplicada a ${affected} miembro(s) correctamente.`,
        affected,
      });
    } catch (error) {
      return handleError(res, req, error, 'Error al aplicar acciÃ³n masiva');
    }
  };

  deleteCommunity = async (req, res) => {
    try {
      const { id } = req.params;
      const communityId = Number(id);
      if (!Number.isInteger(communityId) || communityId <= 0) {
        return res.status(400).json({ message: 'ID de comunidad invÃ¡lido.' });
      }

      const community = await models.community.findByPk(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Comunidad no encontrada.' });
      }

      await db.transaction(async (transaction) => {
        // Reject all pending requests
        await models.user_community_request.update(
          { status: 'REJECTED', reviewedAt: new Date() },
          { where: { communityId, status: 'PENDING' }, transaction }
        );

        // Remove all members
        await models.user_community.destroy({ where: { communityId }, transaction });

        // Delete logo from S3 if present
        if (community.logo_url) {
          await deleteS3Object(community.logo_url);
        }

        // Delete community
        await community.destroy({ transaction });
      });

      await req.logAction({
        accion: 'Comunidad eliminada desde gestion',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `communityId=${communityId}; name=${community.name}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Comunidad eliminada correctamente.' });
    } catch (error) {
      return handleError(res, req, error, 'Error al eliminar comunidad');
    }
  };
}

export default new CommunitiesAdminController();

