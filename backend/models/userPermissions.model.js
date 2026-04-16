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
    const users = await sequelize.models.Users.findAll();
    const permissions = await sequelize.models.Permissions.findAll({ where: { active: true } });
    const presets = await sequelize.models.PresetPermissions.findAll({ where: { active: true } });

    if (users.length === 0 || permissions.length === 0 || presets.length === 0) return;

    const presetPermissionsByRole = presets.reduce((acc, preset) => {
      if (!acc[preset.role]) acc[preset.role] = [];
      acc[preset.role].push(preset.permissionKey);
      return acc;
    }, {});

    const existingRows = await UserPermissions.findAll({ attributes: ['userId', 'permission'] });
    const existingAssignments = new Set(
      existingRows.map((row) => `${row.userId}::${row.permission}`)
    );

    for (const user of users) {
      const basePermissionKeys = presetPermissionsByRole[user.role] || presetPermissionsByRole.USER || [];

      const activePermissionKeys = new Set(permissions.map((permission) => permission.key));

      const rows = basePermissionKeys
        .filter((permissionKey) => activePermissionKeys.has(permissionKey))
        .filter((permissionKey) => !existingAssignments.has(`${user.id}::${permissionKey}`))
        .map((permissionKey) => ({ userId: user.id, permission: permissionKey }));

      if (rows.length > 0) {
        await UserPermissions.bulkCreate(rows);

        for (const row of rows) {
          existingAssignments.add(`${row.userId}::${row.permission}`);
        }
      }
    }

    const danndato = users.find((user) => user.username === 'danndato');
    if (!danndato) return;

    const adminRoutePermissions = [
      'menu.start',
      'menu.userscontrol',
      'menu.users',
      'menu.profile',
      'menu.configuration',
      'menu.aboutapp',
      'menu.gestion',
      'gest.roles',
      'gest.permissions',
      'gest.statuses',
      'user.view',
      'user.edit'
    ];
    const activePermissionKeys = new Set(permissions.map((permission) => permission.key));

    const missingDanndatoPermissions = adminRoutePermissions
      .filter((permissionKey) => activePermissionKeys.has(permissionKey))
      .filter((permissionKey) => !existingAssignments.has(`${danndato.id}::${permissionKey}`))
      .map((permissionKey) => ({ userId: danndato.id, permission: permissionKey }));

    if (missingDanndatoPermissions.length > 0) {
      await UserPermissions.bulkCreate(missingDanndatoPermissions);
    }
  };

  return UserPermissions;
};
