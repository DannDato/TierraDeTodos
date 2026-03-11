import { db, models } from '../../models/index.js';
import { QueryTypes } from 'sequelize';
import { applyRolePresetPermissions } from '../../helpers/applyRolePresetPermissions.js';

class UsersAdminController {
  //metodos internos para usar con el this
  async getAssignableStatuses(transaction) {
    return models.UserStatuses.findAll({
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

 
  // controladores 
  getUsersAdminList = async (req, res) => {
    try {
      //buscar todos los usuarios para listarlos
      const users = await models.Users.findAll({
        attributes: ['id', 'username', 'email', 'role', 'account', 'createdAt', 'updatedAt'],
        order: [['id', 'ASC']]
      });

      // Obtener los permisos de todos los usuarios en una sola consulta
      const permissionRows = await db.query(
        `
          SELECT up.userId, s.key
          FROM user_permissions up
          INNER JOIN Permissions s ON s.key = up.permission
          WHERE s.active = 1
        `,
        { type: QueryTypes.SELECT }
      );

      // Organizar los permisos por userId para facil acceso
      const permissionsByUserId = permissionRows.reduce((acc, row) => {
        if (!acc[row.userId]) acc[row.userId] = [];
        acc[row.userId].push(row.key);
        return acc;
      }, {});

      // Usar 'this' para llamar a los métodos internos de la clase
      const allRoles = await this.getAssignableRoles();
      const allStatuses = await this.getAssignableStatuses();
      
      const rolesCatalog = await models.Roles.findAll({
        attributes: ['role', 'color'],
        where: { active: 'YES' }
      });
      const statusesCatalog = await models.UserStatuses.findAll({
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

      // Formatear la respuesta con los datos de usuario y sus permisos
      const data = users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roleColor: roleColorMap[user.role] || null,
        status: user.account,
        statusColor: statusColorMap[user.account] || null,
        lastConnection: user.updatedAt,
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
      //validacion inicial
      const userId = Number(req.params.id);
      if (!userId) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }

      //buscar el usuario por ID
      const user = await models.Users.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'role', 'account', 'uuid', 'mojang', 'createdAt', 'updatedAt']
      });
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      //registrar la accion de revision de usuario
      req.logAction({
        accion: 'Revision de usuario por ID',
        apartado: 'Usuarios',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `ID de usuario: ${userId}`,
        type: 'info'
      });

      //obtener una lista de todos los permisos activos para mostrar en el admin
      const allPermissions = await models.Permissions.findAll({
        where: { active: true },
        attributes: ['id', 'key', 'name', 'description'],
        order: [['name', 'ASC']]
      });

      //obtener los permisos asignados al usuario
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

      //obtener el historial de cambios de estado del usuario
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

      // Usar 'this' para llamar a los métodos de la clase
      const [roleRecord, statusRecord, assignableRoles, assignableStatuses] = await Promise.all([
        models.Roles.findOne({ attributes: ['color'], where: { role: user.role, active: 'YES' } }),
        models.UserStatuses.findOne({ attributes: ['color'], where: { status: user.account, active: 'YES' } }),
        this.getAssignableRoles(),
        this.getAssignableStatuses()
      ]);

      //formatear la respuesta con todos los datos obtenidos anteriormente
      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          roleColor: roleRecord?.color || null,
          status: user.account,
          statusColor: statusRecord?.color || null,
          uuid: user.uuid,
          mojang: user.mojang,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
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
    //iniciamos transacción para hacer rollback en caso de error y evitar cambios parciales en la base de datos
    const transaction = await db.transaction();
    try {
      const userId = Number(req.params.id);
      const { role } = req.body || {};
      
      //primero se valida el usuario y el role enviado antes de hacer cualquier cambio
      if (!userId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }

      //buscar el usuario por ID para validar que exista antes de intentar actualizarlo
      const user = await models.Users.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Si se envía un role diferente al actual, validar que sea un role permitido
      if (user.role !== role) {
        const assignableRoles = await this.getAssignableRoles(transaction);
        const assignableRoleSet = new Set(assignableRoles.map((item) => item.role));

        if (!role || !assignableRoleSet.has(role)) {
          await transaction.rollback();
          return res.status(400).json({ message: 'Asignación de role inválida' });
        }
      }

      //si el role es valido y el usuario existe, se actualiza el role del usuario
      user.role = role;
      await user.save({ transaction });

      //se aplican permisos preset asociados al nuevo role
      const appliedPermissions = await applyRolePresetPermissions({
        userId,
        role,
        transaction
      });

      //se realiza la transaccion a la bd
      await transaction.commit();

      //registramos log
      await req.logAction({
        accion: 'Role de usuario actualizado con preset de permisos',
        apartado: 'AdminUsers',
        userId: req.user.id,
        username: req.user.username,
        valor: `targetUserId=${userId}; newRole=${role}; permissions=${appliedPermissions.join(',')}`,
        type: 'info'
      });

      //responder
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
    //iniciamos transacción para hacer rollback en caso de error y evitar cambios parciales en la base de datos
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
      
      // Si se envía un role diferente al actual, validar que sea un role permitido
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


const ctrlUsers = new UsersAdminController();
export default ctrlUsers;