export default (sequelize, DataTypes) => {

  const Permissions = sequelize.define('Permissions', {
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
      foreignKey: 'permissionId',
      otherKey: 'userId',
      as: 'users'
    });
  };

  Permissions.seed = async () => {
    const validate = await Permissions.findAll();
    if (validate.length > 0) return;

    await Permissions.bulkCreate([
      { key: 'menu.start', name: 'Inicio', description: 'Permite ver Inicio', active: true },
      { key: 'menu.userscontrol', name: 'Control usuarios', description: 'Permite ver userscontrol', active: true },
      { key: 'menu.users', name: 'Usuarios', description: 'Permite ver users', active: true },
      { key: 'menu.profile', name: 'Perfil', description: 'Permite ver perfil', active: true },
      { key: 'menu.configuration', name: 'Configuración', description: 'Permite ver configuración', active: true },
      { key: 'menu.aboutapp', name: 'Acerca de', description: 'Permite ver about app', active: true }
    ]);
  };

  return Permissions;
};
