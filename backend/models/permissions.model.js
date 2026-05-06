export default (sequelize, DataTypes) => {

  const Permissions = sequelize.define('Permissions', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    key: {
      type: DataTypes.STRING,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'Permissions',
    timestamps: true,
    indexes: [
      {
        name: 'permissions_key_unique',
        unique: true,
        fields: ['key']
      }
    ]
  });

  Permissions.associate = (models) => {
    Permissions.hasMany(models.PresetPermissions, {
      foreignKey: 'permissionKey',
      sourceKey: 'key',
      as: 'presetPermissions',
      constraints: false
    });

    Permissions.hasMany(models.command_permissions, {
      foreignKey: 'permissionKey',
      sourceKey: 'key',
      as: 'commandLinks',
      constraints: false
    });

    Permissions.belongsToMany(models.commands, {
      through: models.command_permissions,
      foreignKey: 'permissionKey',
      otherKey: 'commandId',
      sourceKey: 'key',
      as: 'commands',
      constraints: false
    });

    Permissions.belongsToMany(models.Users, {
      through: models.UserPermissions,
      foreignKey: 'permission',
      sourceKey: 'key',
      otherKey: 'userId',
      as: 'users',
      constraints: false
    });
  };

  Permissions.seed = async () => {
    const seedPermissions = [
      { key: 'menu.start', name: 'Inicio', description: 'Permite ver Inicio', active: true },
      { key: 'menu.tickets', name: 'Tickets', description: 'Permite ver la bandeja de tickets del usuario', active: true },
      { key: 'menu.userscontrol', name: 'Control usuarios', description: 'Permite ver y gestionar usuarios', active: true },
      { key: 'menu.users', name: 'Usuarios', description: 'Permite ver users', active: true },
      { key: 'menu.reports', name: 'Reports', description: 'Permite atender tickets desde reports admin', active: true },
      { key: 'menu.profile', name: 'Perfil', description: 'Permite ver perfil', active: true },
      { key: 'menu.configuration', name: 'Configuración', description: 'Permite ver configuración', active: true },
      { key: 'menu.players', name: 'Jugadores', description: 'Permite ver la sección de jugadores', active: true },
      { key: 'menu.news', name: 'Noticias', description: 'Permite ver la sección de noticias', active: true },
      { key: 'news.create', name: 'Crear noticias', description: 'Permite publicar nuevas noticias', active: true },
      { key: 'news.edit', name: 'Editar noticias', description: 'Permite editar noticias creadas por el usuario', active: true },
      { key: 'news.delete', name: 'Eliminar noticias', description: 'Permite eliminar noticias del sistema', active: true },
      { key: 'menu.download', name: 'Descargas', description: 'Permite ver la sección de descargas', active: true },
      { key: 'menu.aboutapp', name: 'Acerca de', description: 'Permite ver about app', active: true },
      { key: 'menu.community', name: 'Comunidad', description: 'Permite ver la sección de comunidad', active: true },
      { key: 'community.manage', name: 'Gestionar comunidad', description: 'Permite crear y editar comunidades y datos de streamer', active: true },
      { key: 'menu.gestion', name: 'Gestión', description: 'Permite ver gestión de sistema', active: true },
      // derechos de gestion
      { key: 'gest.roles', name: 'Gestionar roles', description: 'Permite crear, editar y eliminar roles', active: true },
      { key: 'gest.permissions', name: 'Gestionar permisos', description: 'Permite crear, editar y eliminar permisos', active: true },
      { key: 'gest.statuses', name: 'Gestionar estatus', description: 'Permite crear, editar y eliminar estatus', active: true },
      { key: 'gest.editions', name: 'Gestionar ediciones', description: 'Permite crear, aperturar, cerrar y eliminar ediciones', active: true },
      { key: 'gest.tickets', name: 'Gestionar tickets', description: 'Permite gestionar tipos, prioridades y estatus de tickets', active: true },
      { key: 'gest.news', name: 'Gestionar noticias', description: 'Permite administrar los tipos de noticias en gestión', active: true },
      { key: 'Commands.manage', name: 'Gestionar comandos', description: 'Permite administrar el catálogo de comandos del juego', active: true },
      { key: 'Communities.admin', name: 'Administrar comunidades', description: 'Permite ver, editar y eliminar comunidades desde gestión', active: true },
      { key: 'emblems.give', name: 'Asignar emblemas', description: 'Permite asignar emblemas manualmente desde el panel administrativo', active: true },
      { key: 'gest.system', name: 'Gestionar sistema', description: 'Permite administrar preferencias globales del sistema', active: true },
      { key: 'tickets.view', name: 'Ver tickets admin', description: 'Permite ver la bandeja de reports y los mensajes de tickets', active: true },
      { key: 'tickets.manage', name: 'Responder tickets admin', description: 'Permite responder tickets desde la pantalla de reports', active: true },
      { key: 'tickets.police', name: 'Ver reportes de policia', description: 'Permite ver solo tickets de tipo REPORTE y REPORTE_ROBO en la pantalla de reports', active: true },
      { key: 'tickets.close', name: 'Cerrar tickets', description: 'Permite cerrar tickets desde la pantalla de reports', active: true },
      { key: 'user.view', name: 'Ver usuarios', description: 'Permite ver la lista de usuarios y sus detalles', active: true },
      { key: 'user.edit', name: 'Editar usuarios', description: 'Permite modificar los datos de los usuarios, incluyendo roles y permisos', active: true },

      { key: 'users.view', name: 'Ver usuarios admin', description: 'Permite consultar listados y detalle de usuarios en administración', active: true },
      { key: 'users.edit', name: 'Editar usuarios admin', description: 'Permite editar datos, rol y permisos de usuarios en administración', active: true },

      { key: 'commands.view', name: 'Ver comandos', description: 'Permite consultar el catálogo de comandos', active: true },
      { key: 'commands.gest', name: 'Gestionar comandos', description: 'Permite crear comandos en el catálogo', active: true },
      { key: 'commands.edit', name: 'Editar comandos', description: 'Permite actualizar comandos del catálogo', active: true },

      { key: 'communities.view', name: 'Ver comunidades admin', description: 'Permite consultar comunidades en gestión', active: true },
      { key: 'communities.gest', name: 'Gestionar comunidades admin', description: 'Permite gestionar miembros y datos de comunidades desde gestión', active: true },
      { key: 'communities.remove', name: 'Eliminar comunidades admin', description: 'Permite eliminar comunidades y sus recursos desde gestión', active: true },

      { key: 'devices.view', name: 'Ver dispositivos', description: 'Permite consultar dispositivos autorizados e historial', active: true },
      { key: 'devices.edit', name: 'Editar dispositivos', description: 'Permite actualizar autorizaciones de dispositivos', active: true },

      { key: 'editions.view', name: 'Ver ediciones', description: 'Permite consultar ediciones y recursos asociados', active: true },
      { key: 'editions.gest', name: 'Gestionar ediciones', description: 'Permite crear ediciones y operar acciones de gestión masiva', active: true },
      { key: 'editions.edit', name: 'Editar ediciones', description: 'Permite actualizar ediciones, fechas y reglas', active: true },
      { key: 'editions.remove', name: 'Eliminar ediciones', description: 'Permite eliminar ediciones, fechas y reglas', active: true },

      { key: 'catalog.news_type.view', name: 'Ver tipos de noticias', description: 'Permite consultar tipos de noticias', active: true },
      { key: 'catalog.news_type.gest', name: 'Gestionar tipos de noticias', description: 'Permite crear tipos de noticias', active: true },
      { key: 'catalog.news_type.edit', name: 'Editar tipos de noticias', description: 'Permite actualizar tipos de noticias', active: true },
      { key: 'catalog.news_type.remove', name: 'Eliminar tipos de noticias', description: 'Permite eliminar tipos de noticias', active: true },

      { key: 'permissions.view', name: 'Ver permisos', description: 'Permite consultar el catálogo de permisos', active: true },
      { key: 'permissions.gest', name: 'Gestionar permisos', description: 'Permite crear permisos', active: true },
      { key: 'permissions.edit', name: 'Editar permisos', description: 'Permite actualizar permisos', active: true },
      { key: 'permissions.remove', name: 'Eliminar permisos', description: 'Permite eliminar permisos', active: true },

      { key: 'roles.view', name: 'Ver roles', description: 'Permite consultar roles y sus permisos', active: true },
      { key: 'roles.gest', name: 'Gestionar roles', description: 'Permite crear roles', active: true },
      { key: 'roles.edit', name: 'Editar roles', description: 'Permite actualizar roles y permisos asociados', active: true },
      { key: 'roles.remove', name: 'Eliminar roles', description: 'Permite eliminar roles', active: true },

      { key: 'sessions.view', name: 'Ver sesiones', description: 'Permite consultar sesiones globales activas', active: true },
      { key: 'sessions.edit', name: 'Gestionar sesiones', description: 'Permite revocar sesiones activas', active: true },

      { key: 'statuses.view', name: 'Ver estatus', description: 'Permite consultar estatus de usuario', active: true },
      { key: 'statuses.gest', name: 'Gestionar estatus', description: 'Permite crear estatus de usuario', active: true },
      { key: 'statuses.edit', name: 'Editar estatus', description: 'Permite actualizar estatus de usuario', active: true },
      { key: 'statuses.remove', name: 'Eliminar estatus', description: 'Permite eliminar estatus de usuario', active: true },

      { key: 'system.view', name: 'Ver sistema', description: 'Permite consultar salud y ajustes del sistema', active: true },
      { key: 'system.gest', name: 'Gestionar sistema', description: 'Permite modificar ajustes administrativos del sistema', active: true },
      { key: 'system.edit', name: 'Editar sistema', description: 'Permite modificar ajustes de sistema en endpoints generales', active: true },

      { key: 'ticket_catalogs.view', name: 'Ver catálogos de tickets', description: 'Permite consultar tipos y prioridades de tickets', active: true },
      { key: 'ticket_catalogs.gest', name: 'Gestionar catálogos de tickets', description: 'Permite crear tipos y prioridades de tickets', active: true },
      { key: 'ticket_catalogs.edit', name: 'Editar catálogos de tickets', description: 'Permite actualizar tipos y prioridades de tickets', active: true },
      { key: 'ticket_catalogs.remove', name: 'Eliminar catálogos de tickets', description: 'Permite eliminar tipos y prioridades de tickets', active: true },

      { key: 'catalog.ticket_status.view', name: 'Ver estados de tickets', description: 'Permite consultar estados de tickets', active: true },
      { key: 'catalog.ticket_status.gest', name: 'Gestionar estados de tickets', description: 'Permite crear estados de tickets', active: true },
      { key: 'catalog.ticket_status.edit', name: 'Editar estados de tickets', description: 'Permite actualizar estados de tickets', active: true },
      { key: 'catalog.ticket_status.remove', name: 'Eliminar estados de tickets', description: 'Permite eliminar estados de tickets', active: true },

      { key: 'emblems.view', name: 'Ver emblemas', description: 'Permite consultar catálogo de emblemas', active: true },
      { key: 'emblems.gest', name: 'Gestionar emblemas', description: 'Permite crear emblemas', active: true },
      { key: 'emblems.edit', name: 'Editar emblemas', description: 'Permite actualizar emblemas', active: true },
      { key: 'emblems.remove', name: 'Eliminar emblemas', description: 'Permite eliminar emblemas del catálogo', active: true },

      { key: 'goals.view', name: 'Ver logros', description: 'Permite consultar catálogo de logros', active: true },
      { key: 'goals.gest', name: 'Gestionar logros', description: 'Permite crear logros', active: true },
      { key: 'goals.edit', name: 'Editar logros', description: 'Permite actualizar logros', active: true },
      { key: 'goals.remove', name: 'Eliminar logros', description: 'Permite eliminar logros del catálogo', active: true }
    ];

    const existing = await Permissions.findAll({ attributes: ['key'] });
    const existingKeys = new Set(existing.map((permission) => permission.key));

    const missingPermissions = seedPermissions.filter((permission) => !existingKeys.has(permission.key));

    if (missingPermissions.length > 0) {
      await Permissions.bulkCreate(missingPermissions);
    }
  };

  return Permissions;
};

