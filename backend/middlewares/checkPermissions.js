import { db } from "../models/index.js";
import { QueryTypes } from 'sequelize';

export const checkPermissions = (requiredPermissions = []) => {

  return async (req, res, next) => {

    const normalizedPermissions = Array.isArray(requiredPermissions)
      ? requiredPermissions.filter(Boolean)
      : [];

    req.requiredPermissions = normalizedPermissions;

    if (normalizedPermissions.length === 0) {
      req.permissionGranted = true;
      return next();
    }

    try {
      const [permissionAccess] = await db.query(
        `
          SELECT s.key
          FROM user_permissions up
          INNER JOIN Permissions s ON s.key = up.permission
          WHERE up.userId = :userId
          AND s.active = 1
          AND s.key IN (:requiredPermissions)
          LIMIT 1
        `,
        {
          replacements: { userId: req.user?.id, requiredPermissions: normalizedPermissions },
          type: QueryTypes.SELECT
        }
      );

      if (!permissionAccess) {
        await req.logAction({
          accion: 'Sin permisos',
          apartado: '',
          userId: req.user?.id,
          username: req.user?.username,
          valor: `Permisos requeridos: ${normalizedPermissions.join(', ')}`,
          type: 'error'
        });

        return res.status(403).json({ message: 'No autorizado para administrar usuarios' });
      }
      
      const user = await db.models.Users.findByPk(req.user.id);
      req.permissionGranted = true;
      req.role = user?.role;
      
      return next();
    } catch (error) {
      await req.logAction({
        accion: `Error al verificar permisos ${error.message}`,
        apartado: 'AdminUsers',
        userId: req.user?.id,
        username: req.user?.username,
        valor: `Permisos requeridos: ${normalizedPermissions.join(', ')}`,
        type: 'error'
      });

      return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  };
};