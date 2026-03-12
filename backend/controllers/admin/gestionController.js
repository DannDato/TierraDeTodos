import { db, models } from '../../models/index.js';

class gestionController {
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
        // const roles = await models.Roles.findAll({
        //     attributes: ['role', 'detail', 'color'],
        //     where: { active: 'YES' },
        //     order: [['role', 'ASC']]
        // });
        const [roles] = await db.query(`
            SELECT id, role, detail, color, asignable, active,
            (SELECT COUNT(id) FROM users WHERE role=Roles.role) AS users,
            (SELECT COUNT(permissionKey) FROM preset_permissions WHERE role=Roles.role) AS permissions
            FROM Roles   
        `)
        return res.json(roles);
    } catch (error) {
      await req.logAction({
        accion: 'Error al listar roles',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });
      return res.status(500).json({ message: 'Error interno del servidor' });
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
      await transaction.rollback();
      await req.logAction({
        accion: 'Error al crear role',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });
      return res.status(500).json({ message: 'Error interno del servidor' });
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
      await transaction.rollback();
      await req.logAction({
        accion: 'Error al actualizar role',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });
      return res.status(500).json({ message: 'Error interno del servidor' });
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
      await transaction.rollback();
      await req.logAction({
        accion: 'Error al eliminar role',
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
      });
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };


}


const ctrlGestion = new gestionController();
export default ctrlGestion;