import { db, models } from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import { applyRolePresetPermissions } from '../../../helpers/applyRolePresetPermissions.js';
import { getEquippedEmblemsByUser } from '../../../helpers/getEquippedEmblems.js';

class UsersController {
  async getAssignableStatuses(transaction) {
    return models.system_statuses.findAll({
      attributes: ['status', 'detail', 'color'],
      where: { asignable: 'YES', active: 'YES' },
      order: [['status', 'ASC']],
      ...(transaction ? { transaction } : {})
    });
  }

  async getAssignableRoles(transaction) {
    return models.Roles.findAll({
      attributes: ['role', 'detail', 'color'],
      where: { asignable: 'YES', active: 'YES' },
      order: [['role', 'ASC']],
      ...(transaction ? { transaction } : {})
    });
  }

  getUsersAdminList = async (req, res) => {
    try {
      const users = await db.query(
        `
          SELECT u.id, u.username, u.email, u.role, u.account, u.createdAt, u.updatedAt,
            c.logo_url AS communityLogo,
            c.color AS communityColor,
            upi.img AS profileImage
          FROM Users u
          LEFT JOIN (SELECT * FROM user_profile_images ORDER BY createdAt DESC LIMIT 1) upi ON upi.userId = u.id
          LEFT JOIN user_community uc ON uc.userId = u.id
          LEFT JOIN community c ON c.id = uc.communityId
          ORDER BY u.id ASC
        `,
        { type: QueryTypes.SELECT }
      );

      const permissionRows = await db.query(
        `
          SELECT up.userId, s.key
          FROM user_permissions up
          INNER JOIN Permissions s ON s.key = up.permission
          WHERE s.active = 1
        `,
        { type: QueryTypes.SELECT }
      );

      const permissionsByUserId = permissionRows.reduce((acc, row) => {
        if (!acc[row.userId]) acc[row.userId] = [];
        acc[row.userId].push(row.key);
        return acc;
      }, {});

      const allRoles = await this.getAssignableRoles();
      const allStatuses = await this.getAssignableStatuses();

      const rolesCatalog = await models.Roles.findAll({
        attributes: ['role', 'color'],
        where: { active: 'YES' }
      });
      const statusesCatalog = await models.system_statuses.findAll({
        attributes: ['status', 'color'],
        where: { active: 'YES' }
      });

      const roleColorMap = rolesCatalog.reduce((acc, roleItem) => {
        acc[roleItem.role] = roleItem.color;
        return acc;
      }, {});
      const statusColorMap = statusesCatalog.reduce((acc, s) => {
        acc[s.status] = s.color;
        return acc;
      }, {});

      const data = users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roleColor: roleColorMap[user.role] || null,
        status: user.account,
        statusColor: statusColorMap[user.account] || null,
        lastConnection: user.updatedAt,
        profileImage: user.profileImage,
        communityLogo: user.communityLogo,
        communityColor: user.communityColor,
        createdAt: user.createdAt,
        permissions: permissionsByUserId[user.id] || []
      }));

      return res.status(200).json({
        users: data,
        allRoles: allRoles.map((role) => ({
          role: role.role,
          detail: role.detail,
          color: role.color
        })),
        allStatuses: allStatuses.map((s) => ({
          status: s.status,
          detail: s.detail,
          color: s.color
        }))
      });

    } catch (error) {
      await req.logAction({
        accion: 'Error al listar usuarios admin',
        apartado: 'AdminUsers',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  getAdminUserById = async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!userId) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }

      const user = await models.Users.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'role', 'account', 'uuid', 'mojang', 'folio', 'createdAt', 'updatedAt']
      });
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      await req.logAction({
        accion: 'Revision de usuario por ID',
        apartado: 'Usuarios',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `ID de usuario: ${userId}`,
        type: 'info'
      });

      const allPermissions = await models.Permissions.findAll({
        where: { active: true },
        attributes: ['id', 'key', 'name', 'description'],
        order: [['name', 'ASC']]
      });

      const assignedPermissionRows = await db.query(
        `
          SELECT s.key
          FROM user_permissions up
          INNER JOIN Permissions s ON s.key = up.permission
          WHERE up.userId = :userId
          AND s.active = 1
        `,
        {
          replacements: { userId },
          type: QueryTypes.SELECT
        }
      );

      const statusHistory = await db.query(
        `
          SELECT
            sh.id,
            sh.old_status AS oldStatus,
            sh.new_status AS newStatus,
            sh.reason,
            sh.created_at AS createdAt,
            sh.changed_by AS changedBy,
            changedByUser.username AS changedByUsername
          FROM user_status_history sh
          LEFT JOIN Users changedByUser ON changedByUser.id = sh.changed_by
          WHERE sh.user = :userId
          ORDER BY sh.created_at DESC, sh.id DESC
        `,
        {
          replacements: { userId },
          type: QueryTypes.SELECT
        }
      );

      const devices = await db.query(
        `
          SELECT
            ud.id AS deviceId,
            ud.folio AS folio,
            ud.device_hash AS deviceHash,
            ud.authorized,
            ud.user_agent AS userAgent,
            ud.ip_address AS ipAddress,
            ud.first_login AS firstLogin,
            ud.last_login AS lastLogin,
            (
              SELECT COUNT(DISTINCT ud2.user)
              FROM user_devices ud2
              WHERE ud2.device_hash = ud.device_hash
            ) AS sharedWithUsers
          FROM user_devices ud
          WHERE ud.user = :userId
          ORDER BY ud.first_login DESC
        `,
        {
          replacements: { userId },
          type: QueryTypes.SELECT
        }
      );

      const latestAvatar = await db.query(
        `
          SELECT
            upi.img AS avatarUrl,
            upi.pos_x AS avatarPosX,
            upi.pos_y AS avatarPosY,
            upi.zoom AS avatarZoom
          FROM user_profile_images upi
          WHERE upi.userId = :userId
          ORDER BY upi.id DESC
          LIMIT 1
        `,
        {
          replacements: { userId },
          type: QueryTypes.SELECT
        }
      );

      const [roleRecord, statusRecord, assignableRoles, assignableStatuses] = await Promise.all([
        models.Roles.findOne({ attributes: ['color', 'complementary', 'enfasis', 'extra'], where: { role: user.role, active: 'YES' } }),
        models.system_statuses.findOne({ attributes: ['color'], where: { status: user.account, active: 'YES' } }),
        this.getAssignableRoles(),
        this.getAssignableStatuses()
      ]);

      const equippedEmblems = await getEquippedEmblemsByUser(user.id);

      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          folio: user.folio,
          role: user.role,
          roleColor: roleRecord?.color || null,
          roleComplementary: roleRecord?.complementary || null,
          roleEnfasis: roleRecord?.enfasis || null,
          roleExtra: roleRecord?.extra || null,
          status: user.account,
          statusColor: statusRecord?.color || null,
          uuid: user.uuid,
          mojang: user.mojang,
          country: 'MX',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          avatarUrl: latestAvatar[0]?.avatarUrl || null,
          avatarPosX: latestAvatar[0]?.avatarPosX ?? 50,
          avatarPosY: latestAvatar[0]?.avatarPosY ?? 50,
          avatarZoom: latestAvatar[0]?.avatarZoom ?? 1,
          equippedEmblems,
          devices,
          statusHistory,
          permissions: assignedPermissionRows.map((permission) => permission.key)
        },
        availablePermissions: allPermissions,
        availableRoles: assignableRoles.map((role) => ({
          role: role.role,
          detail: role.detail,
          color: role.color
        })),
        availableStatuses: assignableStatuses.map((s) => ({
          status: s.status,
          detail: s.detail,
          color: s.color
        }))
      });

    } catch (error) {
      await req.logAction({
        accion: 'Error al obtener usuario admin',
        apartado: 'AdminUsers',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });

      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  updateAdminUserRole = async (req, res) => {
    const transaction = await db.transaction();
    try {
      const userId = Number(req.params.id);
      const { role } = req.body || {};

      if (!userId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }

      const user = await models.Users.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (user.role !== role) {
        const assignableRoles = await this.getAssignableRoles(transaction);
        const assignableRoleSet = new Set(assignableRoles.map((item) => item.role));

        if (!role || !assignableRoleSet.has(role)) {
          await transaction.rollback();
          return res.status(400).json({ message: 'Asignación de role inválida' });
        }
      }

      user.role = role;
      await user.save({ transaction });

      const appliedPermissions = await applyRolePresetPermissions({
        userId,
        role,
        transaction
      });

      await transaction.commit();

      await req.logAction({
        accion: 'Role de usuario actualizado con preset de permisos',
        apartado: 'AdminUsers',
        userId: req.user.id,
        username: req.user.username,
        valor: `targetUserId=${userId}; newRole=${role}; permissions=${appliedPermissions.join(',')}`,
        type: 'info'
      });

      return res.status(200).json({
        message: 'Role actualizado correctamente',
        role,
        permissionKeys: appliedPermissions
      });

    } catch (error) {
      await transaction.rollback();

      await req.logAction({
        accion: 'Error al actualizar role de usuario',
        apartado: 'AdminUsers',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });

      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  updateAdminUserDetails = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const userId = Number(req.params.id);
      const { role, status, reason } = req.body || {};

      if (!userId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }

      const assignableStatusList = await this.getAssignableStatuses(transaction);
      const assignableStatusSet = new Set(assignableStatusList.map((s) => s.status));
      if (!status || !assignableStatusSet.has(status)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Estatus inválido' });
      }

      const user = await models.Users.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const actualRole = user.role;
      if (actualRole !== role) {
        const assignableRoles = await this.getAssignableRoles(transaction);
        const assignableRoleSet = new Set(assignableRoles.map((item) => item.role));

        if (!role || !assignableRoleSet.has(role)) {
          await transaction.rollback();
          return res.status(400).json({ message: 'Asignación de role inválida' });
        }
      }

      const previousRole = user.role;
      const previousStatus = user.account;
      const roleChanged = previousRole !== role;
      const statusChanged = previousStatus !== status;

      let permissionKeys = [];

      if (roleChanged) {
        user.role = role;
        permissionKeys = await applyRolePresetPermissions({
          userId,
          role,
          transaction
        });
      }

      if (statusChanged) {
        user.account = status;

        const historyModel = models.user_status_history || models['user_status_history'];
        if (!historyModel) {
          throw new Error('Modelo user_status_history no disponible');
        }

        await historyModel.create(
          {
            user: userId,
            old_status: previousStatus,
            new_status: status,
            reason: typeof reason === 'string' && reason.trim()
              ? reason.trim()
              : 'Cambio realizado desde el panel de administración',
            changed_by: req.user.id,
            created_at: new Date()
          },
          { transaction }
        );
      }

      if (roleChanged || statusChanged) {
        await user.save({ transaction });
      }

      if (!roleChanged) {
        const assignedPermissionRows = await db.query(
          `
            SELECT s.key
            FROM user_permissions up
            INNER JOIN Permissions s ON s.key = up.permission
            WHERE up.userId = :userId
            AND s.active = 1
          `,
          {
            replacements: { userId },
            type: QueryTypes.SELECT,
            transaction
          }
        );

        permissionKeys = assignedPermissionRows.map((permission) => permission.key);
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Datos de usuario actualizados',
        apartado: 'AdminUsers',
        userId: req.user.id,
        username: req.user.username,
        valor: `targetUserId=${userId}; role=${role}; status=${status}; roleChanged=${roleChanged}; statusChanged=${statusChanged}`,
        type: 'info'
      });

      return res.status(200).json({
        message: roleChanged || statusChanged
          ? 'Datos actualizados correctamente'
          : 'No hubo cambios para guardar',
        role,
        status,
        permissionKeys,
        roleChanged,
        statusChanged
      });
    } catch (error) {
      await transaction.rollback();

      await req.logAction({
        accion: 'Error al actualizar datos de usuario',
        apartado: 'AdminUsers',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });

      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  updateAdminUserPermissions = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const userId = Number(req.params.id);
      const { permissionKeys } = req.body || {};

      if (!userId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }

      if (!Array.isArray(permissionKeys)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'permissionKeys debe ser un arreglo' });
      }

      const user = await models.Users.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const uniquePermissionKeys = [...new Set(permissionKeys)].filter(Boolean);

      const permissions = await models.Permissions.findAll({
        where: { key: uniquePermissionKeys, active: true },
        attributes: ['key'],
        transaction
      });

      const foundPermissionKeys = new Set(permissions.map((permission) => permission.key));
      const invalidPermissionKeys = uniquePermissionKeys.filter((key) => !foundPermissionKeys.has(key));

      if (invalidPermissionKeys.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Permisos inválidos enviados',
          invalidPermissionKeys
        });
      }

      await models.UserPermissions.destroy({
        where: { userId },
        transaction
      });

      if (permissions.length > 0) {
        await models.UserPermissions.bulkCreate(
          permissions.map((permission) => ({ userId, permission: permission.key })),
          { transaction }
        );
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Permisos de usuario actualizados',
        apartado: 'AdminUsers',
        userId: req.user.id,
        username: req.user.username,
        valor: `targetUserId=${userId}; permissions=${uniquePermissionKeys.join(',')}`,
        type: 'info'
      });

      return res.status(200).json({
        message: 'Permisos actualizados correctamente',
        permissionKeys: uniquePermissionKeys
      });
    } catch (error) {
      await transaction.rollback();

      await req.logAction({
        accion: 'Error al actualizar permisos de usuario',
        apartado: 'AdminUsers',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });

      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
}

const ctrlUsers = new UsersController();
export { ctrlUsers };

