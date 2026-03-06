import { models } from '../../models/index.js';

const normalizePermissions = (requiredPermissions) => {
  if (!requiredPermissions) return [];

  if (Array.isArray(requiredPermissions)) return requiredPermissions;

  if (typeof requiredPermissions === 'string') {
    try {
      const parsed = JSON.parse(requiredPermissions);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

export const getUserMenu = async (req, res) => {
  try {
    const userPermissionsRows = await models.UserPermissions.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: models.Permissions,
          as: 'permission',
          where: { active: true },
          attributes: ['key'],
          required: true
        }
      ]
    });

    const userPermissions = userPermissionsRows
      .map((row) => row.permission?.key)
      .filter(Boolean);

    const menuRows = await models.Menu.findAll({
      where: { active: true },
      order: [['orderIndex', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'name', 'icon', 'path', 'target', 'shortAccess', 'required_permissions']
    });

    const menuItems = menuRows
      .map((row) => {
        const item = row.toJSON();
        const requiredPermissions = item.path === '/users'
          ? ['menu.userscontrol']
          : normalizePermissions(item.required_permissions);

        const allowed = requiredPermissions.length === 0
          ? true
          : requiredPermissions.some((permission) => userPermissions.includes(permission));

        return allowed
          ? {
              id: item.id,
              name: item.name,
              icon: item.icon,
              path: item.path,
              target: item.target,
              shortAccess: item.shortAccess,
              required_permissions: requiredPermissions
            }
          : null;
      })
      .filter(Boolean);

    await req.logAction({
      accion: 'Menu dinámico cargado',
      apartado: 'Menu',
      userId: req.user.id,
      username: req.user.username,
      valor: `items=${menuItems.length}`,
      type: 'info'
    });

    return res.status(200).json({
      menuItems,
      permissions: userPermissions
    });
  } catch (error) {
    await req.logAction({
      accion: 'Error al cargar menú dinámico',
      apartado: 'Menu',
      userId: req.user?.id,
      username: req.user?.username,
      valor: error.message,
      type: 'error'
    });

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};
