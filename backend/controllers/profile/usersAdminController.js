import { db, models } from '../../models/index.js';
import { QueryTypes } from 'sequelize';
import { applyRolePresetPermissions } from '../../helpers/applyRolePresetPermissions.js';

const ALLOWED_ROLES = ['ADMIN', 'MOD', 'POLICE', 'STREAMER', 'USER'];

const ensureCanManageUsers = async (req, res) => {
  if (req.user?.rol === 'ADMIN') {
    return true;
  }

  const [permissionAccess] = await db.query(
    `
      SELECT s.key
      FROM UserPermissions up
      INNER JOIN Permissions s ON s.id = up.permissionId
      WHERE up.userId = :userId
      AND s.active = 1
      AND s.key IN ('menu.users', 'menu.userscontrol')
      LIMIT 1
    `,
    {
      replacements: { userId: req.user?.id },
      type: QueryTypes.SELECT
    }
  );

  if (!permissionAccess) {
    res.status(403).json({ message: 'No autorizado para administrar usuarios' });
    return false;
  }

  return true;
};

export const getUsersAdminList = async (req, res) => {
  try {
    if (!(await ensureCanManageUsers(req, res))) return;

    const users = await models.Users.findAll({
      attributes: ['id', 'username', 'email', 'rol', 'account', 'createdAt', 'updatedAt'],
      order: [['id', 'ASC']]
    });

    const permissionRows = await db.query(
      `
        SELECT up.userId, s.key
        FROM UserPermissions up
        INNER JOIN Permissions s ON s.id = up.permissionId
        WHERE s.active = 1
      `,
      { type: QueryTypes.SELECT }
    );

    const permissionsByUserId = permissionRows.reduce((acc, row) => {
      if (!acc[row.userId]) acc[row.userId] = [];
      acc[row.userId].push(row.key);
      return acc;
    }, {});

    const data = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.rol,
      status: user.account,
      lastConnection: user.updatedAt,
      createdAt: user.createdAt,
      permissions: permissionsByUserId[user.id] || []
    }));

    return res.status(200).json({ users: data });
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

export const getAdminUserById = async (req, res) => {
  try {
    if (!(await ensureCanManageUsers(req, res))) return;

    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const user = await models.Users.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'rol', 'account', 'uuid', 'mojang', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const allPermissions = await models.Permissions.findAll({
      where: { active: true },
      attributes: ['id', 'key', 'name', 'description'],
      order: [['name', 'ASC']]
    });

    const assignedPermissionRows = await db.query(
      `
        SELECT s.key
        FROM UserPermissions up
        INNER JOIN Permissions s ON s.id = up.permissionId
        WHERE up.userId = :userId
        AND s.active = 1
      `,
      {
        replacements: { userId },
        type: QueryTypes.SELECT
      }
    );

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.rol,
        status: user.account,
        uuid: user.uuid,
        mojang: user.mojang,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        permissions: assignedPermissionRows.map((permission) => permission.key)
      },
      availablePermissions: allPermissions,
      availableRoles: ALLOWED_ROLES
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

export const updateAdminUserRole = async (req, res) => {
  const transaction = await db.transaction();

  try {
    if (!(await ensureCanManageUsers(req, res))) {
      await transaction.rollback();
      return;
    }

    const userId = Number(req.params.id);
    const { role } = req.body || {};

    if (!userId) {
      await transaction.rollback();
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const user = await models.Users.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.rol = role;
    await user.save({ transaction });

    const appliedPermissions = await applyRolePresetPermissions({
      userId,
      role,
      transaction
    });

    await transaction.commit();

    await req.logAction({
      accion: 'Rol de usuario actualizado con preset de permisos',
      apartado: 'AdminUsers',
      userId: req.user.id,
      username: req.user.username,
      valor: `targetUserId=${userId}; newRole=${role}; permissions=${appliedPermissions.join(',')}`,
      type: 'info'
    });

    return res.status(200).json({
      message: 'Rol actualizado correctamente',
      role,
      permissionKeys: appliedPermissions
    });
  } catch (error) {
    await transaction.rollback();

    await req.logAction({
      accion: 'Error al actualizar rol de usuario',
      apartado: 'AdminUsers',
      userId: req.user?.id,
      username: req.user?.username,
      valor: error.message,
      type: 'error'
    });

    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateAdminUserPermissions = async (req, res) => {
  const transaction = await db.transaction();

  try {
    if (!(await ensureCanManageUsers(req, res))) {
      await transaction.rollback();
      return;
    }

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
      attributes: ['id', 'key'],
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
        permissions.map((permission) => ({ userId, permissionId: permission.id })),
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
