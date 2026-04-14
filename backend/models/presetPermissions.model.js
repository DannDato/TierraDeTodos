export default (sequelize, DataTypes) => {

  const PresetPermissions = sequelize.define('PresetPermissions', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    role: {
      type: DataTypes.ENUM('SUPER-ADMIN', 'ADMIN', 'MOD', 'POLICE', 'STREAMER', 'USER', 'VIP'),
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
    tableName: 'preset_permissions',
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
    const seedPresetPermissions = [
      { role: 'ADMIN', permissionKey: 'menu.start', active: true },
      { role: 'ADMIN', permissionKey: 'menu.users', active: true },
      { role: 'ADMIN', permissionKey: 'menu.userscontrol', active: true },
      { role: 'ADMIN', permissionKey: 'menu.profile', active: true },
      { role: 'ADMIN', permissionKey: 'menu.configuration', active: true },
      { role: 'ADMIN', permissionKey: 'menu.aboutapp', active: true },
      { role: 'ADMIN', permissionKey: 'menu.gestion', active: true },
      { role: 'ADMIN', permissionKey: 'gest.roles', active: true },
      { role: 'ADMIN', permissionKey: 'gest.permissions', active: true },
      { role: 'ADMIN', permissionKey: 'gest.statuses', active: true },
      { role: 'ADMIN', permissionKey: 'user.view', active: true },
      { role: 'ADMIN', permissionKey: 'user.edit', active: true },

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
    ];

    const existing = await PresetPermissions.findAll({ attributes: ['role', 'permissionKey'] });
    const existingKeys = new Set(existing.map((preset) => `${preset.role}::${preset.permissionKey}`));

    const missingPresetPermissions = seedPresetPermissions.filter(
      (preset) => !existingKeys.has(`${preset.role}::${preset.permissionKey}`)
    );

    if (missingPresetPermissions.length > 0) {
      await PresetPermissions.bulkCreate(missingPresetPermissions);
    }
  };

  return PresetPermissions;
};
