export default (sequelize, DataTypes) => {

  const Menu = sequelize.define('Menu', {
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

    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },

    path: {
      type: DataTypes.STRING,
      allowNull: false
    },

    target: {
      type: DataTypes.ENUM('_self', '_blank'),
      allowNull: false,
      defaultValue: '_self'
    },

    shortAccess: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    required_permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'Menu',
    timestamps: true,
    indexes: [
      {
        name: 'menu_key_unique',
        unique: true,
        fields: ['key']
      },
      {
        name: 'menu_active_index',
        fields: ['active']
      }
    ]
  });

  Menu.seed = async () => {
    const seedMenu = [
      {
        key: 'menu.start',
        name: 'Inicio',
        icon: 'Home',
        path: '/start',
        target: '_self',
        shortAccess: true,
        orderIndex: 1,
        required_permissions: ['menu.start'],
        active: true
      },
      {
        key: 'menu.tickets',
        name: 'Tickets',
        icon: 'ClipboardList',
        path: '/tickets',
        target: '_self',
        shortAccess: true,
        orderIndex: 2,
        required_permissions: ['menu.tickets'],
        active: true
      },
      {
        key: 'menu.users',
        name: 'Usuarios',
        icon: 'Users',
        path: '/users',
        target: '_self',
        shortAccess: true,
        orderIndex: 3,
        required_permissions: ['menu.userscontrol'],
        active: true
      },
      {
        key: 'menu.reports',
        name: 'Reports',
        icon: 'Flag',
        path: '/reports',
        target: '_self',
        shortAccess: true,
        orderIndex: 4,
        required_permissions: ['menu.reports'],
        active: true
      },
      {
        key: 'menu.profile',
        name: 'Cuenta',
        icon: 'User',
        path: '/profile',
        target: '_self',
        shortAccess: true,
        orderIndex: 5,
        required_permissions: ['menu.profile'],
        active: true
      },
      {
        key: 'menu.configuration',
        name: 'Configuración',
        icon: 'Settings',
        path: '/configuration',
        target: '_self',
        shortAccess: false,
        orderIndex: 6,
        required_permissions: ['menu.configuration'],
        active: true
      },
      {
        key: 'menu.players',
        name: 'Jugadores',
        icon: 'Gamepad2',
        path: '/players',
        target: '_self',
        shortAccess: false,
        orderIndex: 7,
        required_permissions: ['menu.players'],
        active: true
      },
      {
        key: 'menu.news',
        name: 'Noticias',
        icon: 'Newspaper',
        path: '/news',
        target: '_self',
        shortAccess: false,
        orderIndex: 8,
        required_permissions: ['menu.news'],
        active: true
      },
      {
        key: 'menu.download',
        name: 'Descargas',
        icon: 'Download',
        path: '/download',
        target: '_self',
        shortAccess: false,
        orderIndex: 9,
        required_permissions: ['menu.download'],
        active: true
      },
      {
        key: 'menu.aboutapp',
        name: 'Acerca de',
        icon: 'Info',
        path: '/aboutapp',
        target: '_self',
        shortAccess: false,
        orderIndex: 10,
        required_permissions: ['menu.aboutapp'],
        active: true
      },
      {
        key: 'menu.gestion',
        name: 'Gestión',
        icon: 'MonitorCog',
        path: '/gestion',
        target: '_self',
        shortAccess: true,
        orderIndex: 11,
        required_permissions: ['menu.gestion'],
        active: true
      }
    ];

    const existing = await Menu.findAll({ attributes: ['key'] });
    const existingKeys = new Set(existing.map((item) => item.key));

    const missing = seedMenu.filter((item) => !existingKeys.has(item.key));

    if (missing.length > 0) {
      await Menu.bulkCreate(missing);
    }
  };

  return Menu;
};
