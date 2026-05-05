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
      'menu.tickets',
      'menu.profile',
      'menu.configuration',
      'menu.aboutapp',
      'menu.gestion',
      'menu.reports',
      'gest.roles',
      'gest.permissions',
      'gest.statuses',
      'gest.editions',
      'gest.tickets',
      'gest.news',
      'Commands.manage',
      'Communities.admin',
      'gest.system',
      'emblems.give',
      'user.view',
      'user.edit',

      'users.view',
      'users.edit',

      'commands.view',
      'commands.gest',
      'commands.edit',

      'communities.view',
      'communities.gest',
      'communities.remove',

      'devices.view',
      'devices.edit',

      'editions.view',
      'editions.gest',
      'editions.edit',
      'editions.remove',

      'news_types.view',
      'news_types.gest',
      'news_types.edit',
      'news_types.remove',

      'permissions.view',
      'permissions.gest',
      'permissions.edit',
      'permissions.remove',

      'roles.view',
      'roles.gest',
      'roles.edit',
      'roles.remove',

      'sessions.view',
      'sessions.edit',

      'statuses.view',
      'statuses.gest',
      'statuses.edit',
      'statuses.remove',

      'system.view',
      'system.gest',
      'system.edit',

      'ticket_catalogs.view',
      'ticket_catalogs.gest',
      'ticket_catalogs.edit',
      'ticket_catalogs.remove',

      'ticket_statuses.view',
      'ticket_statuses.gest',
      'ticket_statuses.edit',
      'ticket_statuses.remove',

      'tickets.view',
      'tickets.manage',
      'tickets.police',
      'tickets.close',

      'emblems.view',
      'emblems.gest',
      'emblems.edit',
      'emblems.remove',

      'goals.view',
      'goals.gest',
      'goals.edit',
      'goals.remove'
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
