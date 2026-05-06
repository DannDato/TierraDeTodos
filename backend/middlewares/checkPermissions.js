import { db } from "../models/index.js";
import { QueryTypes } from 'sequelize';

export const checkPermissions = (requiredPermissions = []) => {

  return async (req, res, next) => {

    const permissionAliases = {
      'catalog.news_type.view': 'news_types.view',
      'catalog.news_type.gest': 'news_types.gest',
      'catalog.news_type.edit': 'news_types.edit',
      'catalog.news_type.remove': 'news_types.remove',
      'catalog.ticket_status.view': 'ticket_statuses.view',
      'catalog.ticket_status.gest': 'ticket_statuses.gest',
      'catalog.ticket_status.edit': 'ticket_statuses.edit',
      'catalog.ticket_status.remove': 'ticket_statuses.remove'
    };

    const normalizedPermissions = Array.isArray(requiredPermissions)
      ? requiredPermissions.filter(Boolean)
      : [];

    const lookupPermissions = [...new Set(normalizedPermissions.flatMap((permissionKey) => {
      const alias = permissionAliases[permissionKey];
      return alias ? [permissionKey, alias] : [permissionKey];
    }))];

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
          replacements: { userId: req.user?.id, requiredPermissions: lookupPermissions },
          type: QueryTypes.SELECT
        }
      );

      if (!permissionAccess) {
        await req.logAction({
          accion: `Permisos requeridos: ${normalizedPermissions.join(', ')}`,
          apartado: '',
          userId: req.user?.id,
          username: req.user?.username,
          valor: `Acceso denegado. Permisos insuficientes.`,
          type: 'error'
        });

        return res.status(403).json({ message: 'No autorizado para este apartado' });
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
