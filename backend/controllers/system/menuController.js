import { models } from '../../models/index.js';
import handleError from '../../handlers/handleError.js';

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
  getAdminMenu = async (req, res) => {
    try {
      const rows = await models.Menu.findAll({ order: [['orderIndex', 'ASC'], ['id', 'ASC']] });
      return res.json({ menuItems: rows });
    } catch (error) {
      return handleError(res, req, error, 'Error al consultar catálogo de menú');
    }
  };

  normalizeAdminPayload = (body = {}, current = {}) => {
    let permissions = body.required_permissions ?? current.required_permissions ?? [];
    if (typeof permissions === 'string') {
      try { permissions = JSON.parse(permissions); } catch { permissions = permissions.split(',').map((item) => item.trim()).filter(Boolean); }
    }
    return {
      key: String(body.key ?? current.key ?? '').trim(),
      name: String(body.name ?? current.name ?? '').trim(),
      icon: String(body.icon ?? current.icon ?? '').trim(),
      path: String(body.path ?? current.path ?? '').trim(),
      target: body.target ?? current.target ?? '_self',
      shortAccess: body.shortAccess !== undefined ? body.shortAccess === true || body.shortAccess === 'true' : Boolean(current.shortAccess),
      orderIndex: Number(body.orderIndex ?? current.orderIndex ?? 0),
      basic: body.basic !== undefined ? (body.basic === true || body.basic === 'true' ? 'TRUE' : 'FALSE') : (current.basic || 'FALSE'),
      menuGroup: body.menuGroup ?? current.menuGroup ?? 'user',
      required_permissions: Array.isArray(permissions) ? permissions.map((item) => String(item).trim()).filter(Boolean) : [],
      active: body.active !== undefined ? body.active === true || body.active === 'true' : current.active !== false,
    };
  };

  validateAdminPayload = (payload) => {
    if (!payload.key || !/^[a-zA-Z0-9_.-]{2,100}$/.test(payload.key)) return 'La key es obligatoria y sólo admite letras, números, puntos, guiones y guiones bajos';
    if (!payload.name || !payload.icon || !payload.path) return 'Nombre, icono y ruta son obligatorios';
    if (!['_self', '_blank'].includes(payload.target)) return 'Destino inválido';
    if (!['user', 'admin'].includes(payload.menuGroup)) return 'Grupo de menú inválido';
    if (!['TRUE', 'FALSE'].includes(payload.basic)) return 'Valor basic inválido';
    if (!Number.isInteger(payload.orderIndex) || payload.orderIndex < 0) return 'El orden debe ser un entero positivo';
    if (!payload.path.startsWith('/')) return 'La ruta debe comenzar con /';
    return null;
  };

  createMenuItem = async (req, res) => {
    try {
      const payload = this.normalizeAdminPayload(req.body);
      const validation = this.validateAdminPayload(payload);
      if (validation) return res.status(400).json({ message: validation });
      const existing = await models.Menu.findOne({ where: { key: payload.key } });
      if (existing) return res.status(409).json({ message: 'La key ya existe' });
      const row = await models.Menu.create(payload);
      await req.logAction({ accion: 'Elemento de menú creado', apartado: 'Menu', userId: req.user.id, username: req.user.username, valor: `menuId=${row.id}; key=${row.key}`, type: 'info' });
      return res.status(201).json({ menuItem: row });
    } catch (error) { return handleError(res, req, error, 'Error al crear elemento de menú'); }
  };

  updateMenuItem = async (req, res) => {
    try {
      const row = await models.Menu.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: 'Elemento de menú no encontrado' });
      const payload = this.normalizeAdminPayload(req.body, row);
      const validation = this.validateAdminPayload(payload);
      if (validation) return res.status(400).json({ message: validation });
      const existing = await models.Menu.findOne({ where: { key: payload.key } });
      if (existing && existing.id !== row.id) return res.status(409).json({ message: 'La key ya existe' });
      await row.update(payload);
      await req.logAction({ accion: 'Elemento de menú actualizado', apartado: 'Menu', userId: req.user.id, username: req.user.username, valor: `menuId=${row.id}; key=${row.key}`, type: 'info' });
      return res.json({ menuItem: row });
    } catch (error) { return handleError(res, req, error, 'Error al actualizar elemento de menú'); }
  };

  deleteMenuItem = async (req, res) => {
    try {
      const row = await models.Menu.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: 'Elemento de menú no encontrado' });
      await row.update({ active: false });
      await req.logAction({ accion: 'Elemento de menú desactivado', apartado: 'Menu', userId: req.user.id, username: req.user.username, valor: `menuId=${row.id}; key=${row.key}`, type: 'info' });
      return res.json({ message: 'Elemento de menú desactivado correctamente' });
    } catch (error) { return handleError(res, req, error, 'Error al desactivar elemento de menú'); }
  };

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

    // await req.logAction({
    //   accion: 'Menu dinamico consultado',
    //   apartado: 'Menu',
    //   userId: req.user?.id,
    //   username: req.user?.username,
    //   valor: `items=${menuItems.length}; activeAccount=${isActive}`,
    //   type: 'info'
    // });

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

