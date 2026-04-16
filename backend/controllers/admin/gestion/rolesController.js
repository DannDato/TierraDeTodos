import { db, models } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';
import { applyRolePresetPermissions } from '../../../helpers/applyRolePresetPermissions.js';

class RolesController {
  getRoles = async (req, res) => {
    try {
      const [roles] = await db.query(`
        SELECT id, role, detail, color, asignable, active,
        (SELECT COUNT(id) FROM users WHERE role=Roles.role) AS users,
        (SELECT COUNT(permissionKey) FROM preset_permissions WHERE role=Roles.role) AS permissions
        FROM Roles
      `);
      return res.json(roles);
    } catch (error) {
      handleError(res, req, error, 'Error al listar roles');
    }
  };

  createRole = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const { role, detail, color, asignable = 'YES', active = 'YES' } = req.body || {};
      const normalizedRole = String(role || '').trim().toUpperCase();

      if (!normalizedRole || !detail || !String(detail).trim()) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Role y detail son obligatorios' });
      }

      if (!/^[A-Z0-9_-]+$/.test(normalizedRole)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El role solo permite A-Z, 0-9, _ y -' });
      }

      if (!['YES', 'NO'].includes(asignable) || !['YES', 'NO'].includes(active)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valores inválidos para asignable o active' });
      }

      const existing = await models.Roles.findOne({ where: { role: normalizedRole }, transaction });
      if (existing) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe un role con ese nombre' });
      }

      const newRole = await models.Roles.create(
        {
          role: normalizedRole,
          detail: String(detail).trim(),
          color: color || '#29d096',
          asignable,
          active
        },
        { transaction }
      );

      await transaction.commit();

      await req.logAction({
        accion: 'Role creado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `role=${newRole.role}`,
        type: 'info'
      });

      return res.status(201).json({
        id: newRole.id,
        role: newRole.role,
        detail: newRole.detail,
        color: newRole.color,
        asignable: newRole.asignable,
        active: newRole.active,
        users: 0,
        permissions: 0
      });
    } catch (error) {
      handleError(res, req, error, 'Error al crear role', transaction);
    }
  };

  updateRole = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const roleId = Number(req.params.id);
      const { role, detail, color, asignable, active } = req.body || {};

      if (!roleId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de role inválido' });
      }

      const roleRecord = await models.Roles.findByPk(roleId, { transaction });
      if (!roleRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Role no encontrado' });
      }

      const nextRole = String(role || roleRecord.role).trim().toUpperCase();
      if (!nextRole || !/^[A-Z0-9_-]+$/.test(nextRole)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El role solo permite A-Z, 0-9, _ y -' });
      }

      if (asignable && !['YES', 'NO'].includes(asignable)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valor inválido para asignable' });
      }

      if (active && !['YES', 'NO'].includes(active)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valor inválido para active' });
      }

      const oldRoleName = roleRecord.role;
      const roleChanged = oldRoleName !== nextRole;

      if (roleChanged) {
        const duplicated = await models.Roles.findOne({ where: { role: nextRole }, transaction });
        if (duplicated) {
          await transaction.rollback();
          return res.status(409).json({ message: 'Ya existe un role con ese nombre' });
        }
      }

      roleRecord.role = nextRole;
      roleRecord.detail = String(detail ?? roleRecord.detail).trim();
      roleRecord.color = color || roleRecord.color;
      roleRecord.asignable = asignable || roleRecord.asignable;
      roleRecord.active = active || roleRecord.active;
      await roleRecord.save({ transaction });

      if (roleChanged) {
        await models.Users.update(
          { role: nextRole },
          { where: { role: oldRoleName }, transaction }
        );
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Role actualizado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${roleId}; oldRole=${oldRoleName}; newRole=${nextRole}`,
        type: 'info'
      });

      return res.status(200).json({
        id: roleRecord.id,
        role: roleRecord.role,
        detail: roleRecord.detail,
        color: roleRecord.color,
        asignable: roleRecord.asignable,
        active: roleRecord.active
      });
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar role', transaction);
    }
  };

  deleteRole = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const roleId = Number(req.params.id);
      if (!roleId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de role inválido' });
      }

      const roleRecord = await models.Roles.findByPk(roleId, { transaction });
      if (!roleRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Role no encontrado' });
      }

      if (roleRecord.role === 'USER') {
        await transaction.rollback();
        return res.status(400).json({ message: 'No se puede eliminar el role USER por ser predeterminado' });
      }

      const usersUsingRole = await models.Users.count({ where: { role: roleRecord.role }, transaction });
      if (usersUsingRole > 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'No se puede eliminar: hay usuarios usando este role' });
      }

      await roleRecord.destroy({ transaction });
      await transaction.commit();

      await req.logAction({
        accion: 'Role eliminado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${roleId}; role=${roleRecord.role}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Role eliminado correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar role', transaction);
    }
  };

  getRolePermissions = async (req, res) => {
    try {
      const roleId = Number(req.params.id);
      if (!roleId) {
        return res.status(400).json({ message: 'ID de role inválido' });
      }

      const roleRecord = await models.Roles.findByPk(roleId, {
        attributes: ['id', 'role', 'detail', 'color', 'asignable', 'active']
      });

      if (!roleRecord) {
        return res.status(404).json({ message: 'Role no encontrado' });
      }

      const availablePermissions = await models.Permissions.findAll({
        attributes: ['id', 'key', 'name', 'description', 'active'],
        where: { active: true },
        order: [['key', 'asc']]
      });

      const presetRows = await models.PresetPermissions.findAll({
        attributes: ['permissionKey'],
        where: { role: roleRecord.role, active: true }
      });

      const permissionKeys = [...new Set(presetRows.map((row) => row.permissionKey))];

      return res.status(200).json({
        role: roleRecord,
        availablePermissions,
        permissionKeys
      });
    } catch (error) {
      handleError(res, req, error, 'Error al obtener permisos del role');
    }
  };

  updateRolePermissions = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const roleId = Number(req.params.id);
      const rawPermissionKeys = Array.isArray(req.body?.permissionKeys)
        ? req.body.permissionKeys
        : [];

      if (!roleId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de role inválido' });
      }

      const roleRecord = await models.Roles.findByPk(roleId, { transaction });
      if (!roleRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Role no encontrado' });
      }

      const permissionKeys = [...new Set(rawPermissionKeys
        .map((key) => String(key || '').trim().toLowerCase())
        .filter(Boolean))];

      const foundPermissions = await models.Permissions.findAll({
        attributes: ['key'],
        where: { key: permissionKeys, active: true },
        transaction
      });

      const foundPermissionKeys = new Set(foundPermissions.map((permission) => permission.key));
      const invalidPermissionKeys = permissionKeys.filter((key) => !foundPermissionKeys.has(key));

      if (invalidPermissionKeys.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Permisos inválidos o inactivos: ${invalidPermissionKeys.join(', ')}`
        });
      }

      await models.PresetPermissions.destroy({
        where: { role: roleRecord.role },
        transaction
      });

      if (permissionKeys.length > 0) {
        await models.PresetPermissions.bulkCreate(
          permissionKeys.map((permissionKey) => ({
            role: roleRecord.role,
            permissionKey,
            active: true
          })),
          { transaction }
        );
      }

      const users = await models.Users.findAll({
        attributes: ['id'],
        where: { role: roleRecord.role },
        transaction
      });

      for (const user of users) {
        await applyRolePresetPermissions({
          userId: user.id,
          role: roleRecord.role,
          transaction
        });
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Permisos preset del role actualizados',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `roleId=${roleId}; role=${roleRecord.role}; permissions=${permissionKeys.join(',')}`,
        type: 'info'
      });

      return res.status(200).json({
        message: 'Permisos del role actualizados correctamente',
        permissionKeys,
        affectedUsers: users.length
      });
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar permisos del role', transaction);
    }
  };
}

const ctrlRoles = new RolesController();
export { ctrlRoles };
