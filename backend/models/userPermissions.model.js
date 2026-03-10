export default (sequelize, DataTypes) => {

  const UserPermissions = sequelize.define('UserPermissions', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    permission: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'user_permissions',
    timestamps: true,
    indexes: [
      {
        name: 'user_permissions_user_permission_unique',
        unique: true,
        fields: ['userId', 'permission']
      },
      {
        name: 'user_permissions_user_index',
        fields: ['userId']
      },
      {
        name: 'user_permissions_permission_index',
        fields: ['permission']
      }
    ]
  });

  UserPermissions.associate = (models) => {
    UserPermissions.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    UserPermissions.belongsTo(models.Permissions, {
      foreignKey: 'permission',
      targetKey: 'key',
      as: 'permissionRef',
      onDelete: 'CASCADE'
    });
  };

  UserPermissions.seed = async () => {
    const validate = await UserPermissions.findAll();
    if (validate.length > 0) return;

    const users = await sequelize.models.Users.findAll();
    const permissions = await sequelize.models.Permissions.findAll({ where: { active: true } });
    const presets = await sequelize.models.PresetPermissions.findAll({ where: { active: true } });

    if (users.length === 0 || permissions.length === 0 || presets.length === 0) return;

    const presetPermissionsByRole = presets.reduce((acc, preset) => {
      if (!acc[preset.role]) acc[preset.role] = [];
      acc[preset.role].push(preset.permissionKey);
      return acc;
    }, {});

    for (const user of users) {
      const basePermissionKeys = presetPermissionsByRole[user.rol] || presetPermissionsByRole.USER || [];

      const activePermissionKeys = new Set(permissions.map((permission) => permission.key));

      const rows = basePermissionKeys
        .filter((permissionKey) => activePermissionKeys.has(permissionKey))
        .map((permissionKey) => ({ userId: user.id, permission: permissionKey }));

      if (rows.length > 0) {
        await UserPermissions.bulkCreate(rows, { ignoreDuplicates: true });
      }
    }
  };

  return UserPermissions;
};
