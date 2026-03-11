import { db, models } from '../../models/index.js';
import { QueryTypes } from 'sequelize';
import { applyRolePresetPermissions } from '../../helpers/applyRolePresetPermissions.js';

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


}


const ctrlGestion = new gestionController();
export default ctrlGestion;