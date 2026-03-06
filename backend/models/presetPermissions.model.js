export default (sequelize, DataTypes) => {

  const PresetPermissions = sequelize.define('PresetPermissions', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    role: {
      type: DataTypes.ENUM('ADMIN', 'MOD', 'POLICE', 'STREAMER', 'USER'),
      allowNull: false
    },

    permissionKey: {
      type: DataTypes.STRING,
      allowNull: false
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'PresetPermissions',
    timestamps: true,
    indexes: [
      {
        name: 'preset_permissions_role_permission_unique',
        unique: true,
        fields: ['role', 'permissionKey']
      },
      {
        name: 'preset_permissions_role_index',
        fields: ['role']
      }
    ]
  });

  PresetPermissions.seed = async () => {
    const validate = await PresetPermissions.findAll();
    if (validate.length > 0) return;

    await PresetPermissions.bulkCreate([
      { role: 'ADMIN', permissionKey: 'menu.start', active: true },
      { role: 'ADMIN', permissionKey: 'menu.users', active: true },
      { role: 'ADMIN', permissionKey: 'menu.userscontrol', active: true },
      { role: 'ADMIN', permissionKey: 'menu.profile', active: true },
      { role: 'ADMIN', permissionKey: 'menu.configuration', active: true },
      { role: 'ADMIN', permissionKey: 'menu.aboutapp', active: true },

      { role: 'MOD', permissionKey: 'menu.start', active: true },
      { role: 'MOD', permissionKey: 'menu.profile', active: true },
      { role: 'MOD', permissionKey: 'menu.configuration', active: true },
      { role: 'MOD', permissionKey: 'menu.aboutapp', active: true },

      { role: 'POLICE', permissionKey: 'menu.start', active: true },
      { role: 'POLICE', permissionKey: 'menu.profile', active: true },
      { role: 'POLICE', permissionKey: 'menu.aboutapp', active: true },

      { role: 'STREAMER', permissionKey: 'menu.start', active: true },
      { role: 'STREAMER', permissionKey: 'menu.profile', active: true },
      { role: 'STREAMER', permissionKey: 'menu.aboutapp', active: true },

      { role: 'USER', permissionKey: 'menu.start', active: true },
      { role: 'USER', permissionKey: 'menu.profile', active: true },
      { role: 'USER', permissionKey: 'menu.aboutapp', active: true },
      { role: 'USER', permissionKey: 'menu.configuration', active: true }
    ]);
  };

  return PresetPermissions;
};
