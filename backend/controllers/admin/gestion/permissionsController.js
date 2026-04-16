import { db, models } from '../../../models/index.js';
import handleError from '../../../handlers/handleError.js';

class PermissionsController {
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

  createPermission = async (req, res) => {
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

const ctrlPermissions = new PermissionsController();
export { ctrlPermissions };
