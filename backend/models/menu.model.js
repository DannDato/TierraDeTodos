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
    basic:{
      type: DataTypes.ENUM('TRUE', 'FALSE'),
      allowNull: false,
      defaultValue: 'FALSE',
      field: 'basic'
    },

    menuGroup: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
      field: 'menu_group'
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
        id: 1,
        key: 'menu.start',
        name: 'Inicio',
        icon: 'Home',
        path: '/start',
        target: '_self',
        shortAccess: true,
        orderIndex: 1,
        required_permissions: ['menu.start'],
        menuGroup: 'user',
        active: true
      },
      {
        id: 13,
        key: 'menu.progress',
        name: 'Progreso',
        icon: 'TrendingUp',
        path: '/progress',
        target: '_self',
        shortAccess: false,
        orderIndex: 2,
        required_permissions: ['menu.progress'],
        menuGroup: 'user',
        active: true
      },
      {
        id: 8,
        key: 'menu.news',
        name: 'Noticias',
        icon: 'Newspaper',
        path: '/news',
        target: '_self',
        shortAccess: true,
        orderIndex: 3,
        required_permissions: ['menu.news'],
        menuGroup: 'user',
        active: true
      },
      {
        id: 7,
        key: 'menu.players',
        name: 'Jugadores',
        icon: 'Gamepad2',
        path: '/players',
        target: '_self',
        shortAccess: true,
        orderIndex: 4,
        required_permissions: ['menu.players'],
        menuGroup: 'user',
        active: true
      },
      {
        id: 2,
        key: 'menu.tickets',
        name: 'Tickets',
        icon: 'ClipboardList',
        path: '/tickets',
        target: '_self',
        shortAccess: false,
        orderIndex: 5,
        required_permissions: ['menu.tickets'],
        menuGroup: 'user',
        active: true
      },
      {
        id: 4,
        key: 'menu.reports',
        name: 'Reports',
        icon: 'Flag',
        path: '/reports',
        target: '_self',
        shortAccess: false,
        orderIndex: 5,
        required_permissions: ['menu.reports'],
        menuGroup: 'admin',
        active: true
      },
      {
        id: 5,
        key: 'menu.profile',
        name: 'Cuenta',
        icon: 'User',
        path: '/profile',
        target: '_self',
        shortAccess: true,
        orderIndex: 7,
        required_permissions: ['menu.profile'],
        menuGroup: 'user',
        active: true
      },
      {
        id: 6,
        key: 'menu.community',
        name: 'Comunidad',
        icon: 'Users',
        path: '/community',
        target: '_self',
        shortAccess: false,
        orderIndex: 6,
        required_permissions: ['menu.community'],
        menuGroup: 'user',
        active: true
      },
      {
        id: 14,
        key: 'menu.commands',
        name: 'Commands',
        icon: 'Code',
        path: '/commands',
        target: '_self',
        shortAccess: false,
        orderIndex: 7,
        required_permissions: ['menu.commands'],
        menuGroup: 'user',
        active: true
      },
      {
        id: 3,
        key: 'menu.users',
        name: 'Usuarios',
        icon: 'Users',
        path: '/users',
        target: '_self',
        shortAccess: false,
        orderIndex: 8,
        required_permissions: ['menu.userscontrol'],
        menuGroup: 'admin',
        active: true
      },
      {
        id: 10,
        key: 'menu.aboutapp',
        name: 'Acerca de',
        icon: 'Info',
        path: '/',
        target: '_self',
        shortAccess: false,
        orderIndex: 9,
        required_permissions: [],
        menuGroup: 'user',
        active: true
      },
      {
        id: 11,
        key: 'menu.emblems',
        name: 'Emblemas',
        icon: 'Award',
        path: '/emblems-admin',
        target: '_self',
        shortAccess: false,
        orderIndex: 11,
        required_permissions: ['emblems.give'],
        menuGroup: 'admin',
        active: true
      },
      {
        id: 12,
        key: 'menu.gestion',
        name: 'Gestión',
        icon: 'MonitorCog',
        path: '/gestion',
        target: '_self',
        shortAccess: false,
        orderIndex: 10,
        required_permissions: ['menu.gestion'],
        menuGroup: 'admin',
        active: true
      },
    ];

    const allowedKeys = seedMenu.map((item) => item.key);

    for (const item of seedMenu) {
      const existing = await Menu.findOne({ where: { key: item.key } });

      if (!existing) {
        await Menu.create(item);
      } else {
        await existing.update({
          name: item.name,
          icon: item.icon,
          path: item.path,
          target: item.target,
          shortAccess: item.shortAccess,
          orderIndex: item.orderIndex,
          required_permissions: item.required_permissions,
          menuGroup: item.menuGroup,
          active: item.active
        });
      }
    }

    const existingRows = await Menu.findAll({ attributes: ['id', 'key', 'active'] });
    for (const row of existingRows) {
      if (!allowedKeys.includes(row.key) && row.active) {
        await row.update({ active: false });
      }
    }
  };

  return Menu;
};

