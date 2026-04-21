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
    Permissions.belongsToMany(models.Users, {
      through: models.UserPermissions,
      foreignKey: 'permission',
      sourceKey: 'key',
      otherKey: 'userId',
      as: 'users'
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
      { key: 'menu.gestion', name: 'Gestión', description: 'Permite ver gestión de sistema', active: true },
      // derechos de gestion
      { key: 'gest.roles', name: 'Gestionar roles', description: 'Permite crear, editar y eliminar roles', active: true },
      { key: 'gest.permissions', name: 'Gestionar permisos', description: 'Permite crear, editar y eliminar permisos', active: true },
      { key: 'gest.statuses', name: 'Gestionar estatus', description: 'Permite crear, editar y eliminar estatus', active: true },
      { key: 'gest.editions', name: 'Gestionar ediciones', description: 'Permite crear, aperturar, cerrar y eliminar ediciones', active: true },
      { key: 'gest.tickets', name: 'Gestionar tickets', description: 'Permite gestionar tipos, prioridades y estatus de tickets', active: true },
      { key: 'gest.news', name: 'Gestionar noticias', description: 'Permite administrar los tipos de noticias en gestión', active: true },
      { key: 'gest.system', name: 'Gestionar sistema', description: 'Permite administrar preferencias globales del sistema', active: true },
      { key: 'tickets.view', name: 'Ver tickets admin', description: 'Permite ver la bandeja de reports y los mensajes de tickets', active: true },
      { key: 'tickets.manage', name: 'Responder tickets admin', description: 'Permite responder tickets desde la pantalla de reports', active: true },
      { key: 'tickets.police', name: 'Ver reportes de policia', description: 'Permite ver solo tickets de tipo REPORTE y REPORTE_ROBO en la pantalla de reports', active: true },
      { key: 'tickets.close', name: 'Cerrar tickets', description: 'Permite cerrar tickets desde la pantalla de reports', active: true },
      { key: 'user.view', name: 'Ver usuarios', description: 'Permite ver la lista de usuarios y sus detalles', active: true },
      { key: 'user.edit', name: 'Editar usuarios', description: 'Permite modificar los datos de los usuarios, incluyendo roles y permisos', active: true }
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
