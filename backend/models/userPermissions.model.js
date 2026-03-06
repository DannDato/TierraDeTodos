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

    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'UserPermissions',
    timestamps: true,
    indexes: [
      {
        name: 'user_permissions_user_permission_unique',
        unique: true,
        fields: ['userId', 'permissionId']
      },
      {
        name: 'user_permissions_user_index',
        fields: ['userId']
      },
      {
        name: 'user_permissions_permission_index',
        fields: ['permissionId']
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
      foreignKey: 'permissionId',
      as: 'permission',
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

    const permissionIdByKey = permissions.reduce((acc, permission) => {
      acc[permission.key] = permission.id;
      return acc;
    }, {});

    const presetPermissionsByRole = presets.reduce((acc, preset) => {
      if (!acc[preset.role]) acc[preset.role] = [];
      acc[preset.role].push(preset.permissionKey);
      return acc;
    }, {});

    for (const user of users) {
      const basePermissionKeys = presetPermissionsByRole[user.rol] || presetPermissionsByRole.USER || [];

      const rows = basePermissionKeys
        .map((permissionKey) => permissionIdByKey[permissionKey])
        .filter(Boolean)
        .map((permissionId) => ({ userId: user.id, permissionId }));

      if (rows.length > 0) {
        await UserPermissions.bulkCreate(rows, { ignoreDuplicates: true });
      }
    }
  };

  return UserPermissions;
};
