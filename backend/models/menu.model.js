export default (sequelize, DataTypes) => {

  const Menu = sequelize.define('Menu', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
    const validate = await Menu.findAll();
    if (validate.length > 0) return;

    await Menu.bulkCreate([
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
        key: 'menu.users',
        name: 'Usuarios',
        icon: 'Users',
        path: '/users',
        target: '_self',
        shortAccess: true,
        orderIndex: 3,
        required_permissions: ['menu.users'],
        active: true
      },
      {
        key: 'menu.profile',
        name: 'Cuenta',
        icon: 'User',
        path: '/profile',
        target: '_self',
        shortAccess: true,
        orderIndex: 4,
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
        orderIndex: 5,
        required_permissions: ['menu.configuration'],
        active: true
      },
      {
        key: 'menu.aboutapp',
        name: 'Acerca de',
        icon: 'Info',
        path: '/aboutapp',
        target: '_self',
        shortAccess: false,
        orderIndex: 6,
        required_permissions: ['menu.aboutapp'],
        active: true
      }
    ]);
  };

  return Menu;
};
