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

class MenuController {
  getUserMenu = async (req, res) => {
  try {
    const userPermissions = req.user && req.user.permissions ? req.user.permissions : [];
    const isActive = req.user.account != 'INACTIVE' && req.user.account != 'BANNED';

    let menuRows = [];
    if(isActive){
      menuRows = await models.Menu.findAll({
        where: { active: true },
        order: [['orderIndex', 'ASC'], ['id', 'ASC']],
        attributes: ['id', 'name', 'icon', 'path', 'target', 'shortAccess', 'required_permissions', 'menuGroup']
      });
    } else {
      menuRows = await models.Menu.findAll({
        where: { active: true, basic: 'TRUE' },
        order: [['orderIndex', 'ASC'], ['id', 'ASC']],
        attributes: ['id', 'name', 'icon', 'path', 'target', 'shortAccess', 'required_permissions', 'menuGroup']
      });
    }

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
              menuGroup: item.menuGroup,
              required_permissions: requiredPermissions
            }
          : null;
      })
      .filter(Boolean);

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
}

const ctrlMenu = new MenuController();
export { ctrlMenu };
