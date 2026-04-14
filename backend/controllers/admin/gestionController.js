import { db, models } from '../../models/index.js';
import  handleError  from '../../handlers/handleError.js';
import { applyRolePresetPermissions } from '../../helpers/applyRolePresetPermissions.js';

class rolesController {
  //metodos internos para usar con el this
//   async getAssignableStatuses(transaction) {
//     return models.UserStatuses.findAll({
//       attributes: ['status', 'detail', 'color'],
//       where: { asignable: 'YES', active: 'YES' },
//       order: [['status', 'ASC']],
//       ...(transaction ? { transaction } : {})
//     });
//   }

  // controladores
  getRoles = async (req, res) => {
    try {
        const [roles] = await db.query(`
            SELECT id, role, detail, color, asignable, active,
            (SELECT COUNT(id) FROM users WHERE role=Roles.role) AS users,
            (SELECT COUNT(permissionKey) FROM preset_permissions WHERE role=Roles.role) AS permissions
            FROM Roles
        `)
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

class permissionsController {
  normalizePermissionKey = (key) => String(key || '').trim().toLowerCase();

  normalizePermissionName = (name) => String(name || '').trim();

  normalizePermissionDescription = (description) => String(description || '').trim();

  normalizeActiveValue = (active, defaultValue = true) => {
    if (typeof active === 'boolean') return active;
    if (typeof active === 'string') {
      const normalized = active.trim().toLowerCase();
      if (['true', '1', 'yes', 'si', 'activo'].includes(normalized)) return true;
      if (['false', '0', 'no', 'inactivo'].includes(normalized)) return false;
    }
    return defaultValue;
  };

  getPermissions = async (req, res) => {
    try {
      const permissions = await models.Permissions.findAll({
        attributes: ['id', 'key', 'name', 'description', 'active'],
        order: [['key', 'asc']],
        where: { key: { [db.Sequelize.Op.notLike]: 'gest.%' } }
      });
      return res.json(permissions);

    } catch (error) {
      handleError(res, req, error, 'Error al obtener permisos');
    }
  };

  createPermission = async (req,res) => {
    const transaction = await db.transaction();

    try {
      const { key, name, description, active = true } = req.body || {};
      const normalizedKey = this.normalizePermissionKey(key);
      const normalizedName = this.normalizePermissionName(name);
      const normalizedDescription = this.normalizePermissionDescription(description);
      const normalizedActive = this.normalizeActiveValue(active, true);

      if (!normalizedKey || !normalizedName) {
        await transaction.rollback();
        return res.status(400).json({ message: 'key y name son obligatorios' });
      }

      if (!/^[a-z0-9._-]+$/.test(normalizedKey)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El key solo permite a-z, 0-9, punto, guion y guion bajo' });
      }

      const existingPermission = await models.Permissions.findOne({
        where: { key: normalizedKey },
        transaction
      });

      if (existingPermission) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe un permiso con ese key' });
      }

      const createdPermission = await models.Permissions.create(
        {
          key: normalizedKey,
          name: normalizedName,
          description: normalizedDescription || null,
          active: normalizedActive
        },
        { transaction }
      );

      await transaction.commit();

      await req.logAction({
        accion: 'Permiso creado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${createdPermission.id}; key=${createdPermission.key}`,
        type: 'info'
      });

      return res.status(201).json({
        id: createdPermission.id,
        key: createdPermission.key,
        name: createdPermission.name,
        description: createdPermission.description,
        active: createdPermission.active
      });
    } catch (error) {
      handleError(res, req, error, 'Error al crear permiso', transaction);
    }
  };

  updatePermission = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const permissionId = Number(req.params.id);
      const { key, name, description, active } = req.body || {};

      if (!permissionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de permiso inválido' });
      }

      const permissionRecord = await models.Permissions.findByPk(permissionId, { transaction });
      if (!permissionRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Permiso no encontrado' });
      }

      const nextKey = this.normalizePermissionKey(key || permissionRecord.key);
      const nextName = this.normalizePermissionName(name || permissionRecord.name);
      const nextDescription = description === undefined
        ? permissionRecord.description
        : this.normalizePermissionDescription(description);
      const nextActive = active === undefined
        ? permissionRecord.active
        : this.normalizeActiveValue(active, permissionRecord.active);

      if (!nextKey || !nextName) {
        await transaction.rollback();
        return res.status(400).json({ message: 'key y name son obligatorios' });
      }

      if (!/^[a-z0-9._-]+$/.test(nextKey)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El key solo permite a-z, 0-9, punto, guion y guion bajo' });
      }

      const oldKey = permissionRecord.key;
      const keyChanged = oldKey !== nextKey;

      if (keyChanged) {
        const duplicated = await models.Permissions.findOne({ where: { key: nextKey }, transaction });
        if (duplicated) {
          await transaction.rollback();
          return res.status(409).json({ message: 'Ya existe un permiso con ese key' });
        }
      }

      permissionRecord.key = nextKey;
      permissionRecord.name = nextName;
      permissionRecord.description = nextDescription || null;
      permissionRecord.active = nextActive;
      await permissionRecord.save({ transaction });

      if (keyChanged) {
        await models.UserPermissions.update(
          { permission: nextKey },
          { where: { permission: oldKey }, transaction }
        );

        await models.PresetPermissions.update(
          { permissionKey: nextKey },
          { where: { permissionKey: oldKey }, transaction }
        );
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Permiso actualizado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${permissionId}; oldKey=${oldKey}; newKey=${nextKey}; active=${nextActive}`,
        type: 'info'
      });

      return res.status(200).json({
        id: permissionRecord.id,
        key: permissionRecord.key,
        name: permissionRecord.name,
        description: permissionRecord.description,
        active: permissionRecord.active
      });
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar permiso', transaction);
    }
  };

  deletePermission = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const permissionId = Number(req.params.id);

      if (!permissionId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de permiso inválido' });
      }

      const permissionRecord = await models.Permissions.findByPk(permissionId, { transaction });
      if (!permissionRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Permiso no encontrado' });
      }

      const usersUsingPermission = await models.UserPermissions.count({
        where: { permission: permissionRecord.key },
        transaction
      });

      if (usersUsingPermission > 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'No se puede eliminar: hay usuarios usando este permiso' });
      }

      await models.PresetPermissions.destroy({
        where: { permissionKey: permissionRecord.key },
        transaction
      });

      await permissionRecord.destroy({ transaction });
      await transaction.commit();

      await req.logAction({
        accion: 'Permiso eliminado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${permissionId}; key=${permissionRecord.key}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Permiso eliminado correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar permiso', transaction);
    }
  };
}

class statusController {
  getStatuses = async (req, res) => {
    try {
      const [statuses] = await db.query(`
        SELECT
          us.id,
          us.status,
          us.detail,
          us.color,
          us.asignable,
          us.active,
          (SELECT COUNT(id) FROM Users WHERE account = us.status) AS users
        FROM UserStatuses us
        ORDER BY us.status ASC
      `);

      return res.status(200).json(statuses);
    } catch (error) {
      handleError(res, req, error, 'Error al listar estatus');
    }
  };

  createStatus = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const {
        status,
        detail,
        color = '#8a8a8a',
        asignable = 'YES',
        active = 'YES'
      } = req.body || {};

      const normalizedStatus = String(status || '').trim().toUpperCase();
      const normalizedDetail = String(detail || '').trim();

      if (!normalizedStatus || !normalizedDetail) {
        await transaction.rollback();
        return res.status(400).json({ message: 'status y detail son obligatorios' });
      }

      if (!/^[A-Z0-9_-]+$/.test(normalizedStatus)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El status solo permite A-Z, 0-9, _ y -' });
      }

      if (!['YES', 'NO'].includes(asignable) || !['YES', 'NO'].includes(active)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valores inválidos para asignable o active' });
      }

      const existingStatus = await models.UserStatuses.findOne({
        where: { status: normalizedStatus },
        transaction
      });

      if (existingStatus) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Ya existe un estatus con ese nombre' });
      }

      const createdStatus = await models.UserStatuses.create(
        {
          status: normalizedStatus,
          detail: normalizedDetail,
          color,
          asignable,
          active
        },
        { transaction }
      );

      await transaction.commit();

      await req.logAction({
        accion: 'Estatus creado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `status=${createdStatus.status}`,
        type: 'info'
      });

      return res.status(201).json({
        id: createdStatus.id,
        status: createdStatus.status,
        detail: createdStatus.detail,
        color: createdStatus.color,
        asignable: createdStatus.asignable,
        active: createdStatus.active,
        users: 0
      });
    } catch (error) {
      handleError(res, req, error, 'Error al crear estatus', transaction);
    }
  };

  updateStatus = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const statusId = Number(req.params.id);
      const { status, detail, color, asignable, active } = req.body || {};

      if (!statusId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de estatus inválido' });
      }

      const statusRecord = await models.UserStatuses.findByPk(statusId, { transaction });
      if (!statusRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Estatus no encontrado' });
      }

      const nextStatus = String(status || statusRecord.status).trim().toUpperCase();
      const nextDetail = String(detail ?? statusRecord.detail).trim();

      if (!nextStatus || !nextDetail) {
        await transaction.rollback();
        return res.status(400).json({ message: 'status y detail son obligatorios' });
      }

      if (!/^[A-Z0-9_-]+$/.test(nextStatus)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El status solo permite A-Z, 0-9, _ y -' });
      }

      if (asignable && !['YES', 'NO'].includes(asignable)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valor inválido para asignable' });
      }

      if (active && !['YES', 'NO'].includes(active)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valor inválido para active' });
      }

      const oldStatus = statusRecord.status;
      const statusChanged = oldStatus !== nextStatus;

      if (statusChanged) {
        const duplicated = await models.UserStatuses.findOne({
          where: { status: nextStatus },
          transaction
        });

        if (duplicated) {
          await transaction.rollback();
          return res.status(409).json({ message: 'Ya existe un estatus con ese nombre' });
        }
      }

      statusRecord.status = nextStatus;
      statusRecord.detail = nextDetail;
      statusRecord.color = color || statusRecord.color;
      statusRecord.asignable = asignable || statusRecord.asignable;
      statusRecord.active = active || statusRecord.active;
      await statusRecord.save({ transaction });

      if (statusChanged) {
        await models.Users.update(
          { account: nextStatus },
          { where: { account: oldStatus }, transaction }
        );

        const historyModel = models.user_status_history || models['user_status_history'];
        if (historyModel) {
          await historyModel.update(
            { old_status: nextStatus },
            { where: { old_status: oldStatus }, transaction }
          );

          await historyModel.update(
            { new_status: nextStatus },
            { where: { new_status: oldStatus }, transaction }
          );
        }
      }

      await transaction.commit();

      await req.logAction({
        accion: 'Estatus actualizado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${statusId}; oldStatus=${oldStatus}; newStatus=${nextStatus}`,
        type: 'info'
      });

      return res.status(200).json({
        id: statusRecord.id,
        status: statusRecord.status,
        detail: statusRecord.detail,
        color: statusRecord.color,
        asignable: statusRecord.asignable,
        active: statusRecord.active
      });
    } catch (error) {
      handleError(res, req, error, 'Error al actualizar estatus', transaction);
    }
  };

  deleteStatus = async (req, res) => {
    const transaction = await db.transaction();

    try {
      const statusId = Number(req.params.id);

      if (!statusId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de estatus inválido' });
      }

      const statusRecord = await models.UserStatuses.findByPk(statusId, { transaction });
      if (!statusRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Estatus no encontrado' });
      }

      if (statusRecord.status === 'ACTIVE' || statusRecord.status === 'INACTIVE') {
        await transaction.rollback();
        return res.status(400).json({ message: 'No se puede eliminar un estatus base del sistema' });
      }

      const usersUsingStatus = await models.Users.count({
        where: { account: statusRecord.status },
        transaction
      });

      if (usersUsingStatus > 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'No se puede eliminar: hay usuarios usando este estatus' });
      }

      await statusRecord.destroy({ transaction });
      await transaction.commit();

      await req.logAction({
        accion: 'Estatus eliminado',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `id=${statusId}; status=${statusRecord.status}`,
        type: 'info'
      });

      return res.status(200).json({ message: 'Estatus eliminado correctamente' });
    } catch (error) {
      handleError(res, req, error, 'Error al eliminar estatus', transaction);
    }
  };
}

const ctrlRoles = new rolesController();
const ctrlPermissions = new permissionsController();
const ctrlStatus = new statusController();
export { ctrlRoles, ctrlPermissions, ctrlStatus };


