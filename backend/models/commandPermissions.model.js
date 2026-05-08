export default (sequelize, DataTypes) => {
  const command_permissions = sequelize.define('command_permissions', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    commandId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'command_id'
    },
    permissionKey: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'permission_key'
    }
  }, {
    tableName: 'command_permissions',
    timestamps: true,
    indexes: [
      {
        name: 'command_permissions_unique',
        unique: true,
        fields: ['command_id', 'permission_key']
      },
      {
        name: 'command_permissions_command_idx',
        fields: ['command_id']
      },
      {
        name: 'command_permissions_permission_idx',
        fields: ['permission_key']
      }
    ]
  });

  command_permissions.associate = (models) => {
    command_permissions.belongsTo(models.commands, {
      foreignKey: 'commandId',
      as: 'command',
      onDelete: 'CASCADE',
      constraints: false
    });

    command_permissions.belongsTo(models.Permissions, {
      foreignKey: 'permissionKey',
      targetKey: 'key',
      as: 'permission',
      onDelete: 'CASCADE',
      constraints: false
    });
  };

  command_permissions.seed = async () => {
    const commandsRows = await sequelize.models.commands.findAll({
      attributes: ['id', 'permissions']
    });

    const allPermissionKeys = new Set(
      (await sequelize.models.Permissions.findAll({ attributes: ['key'] }))
        .map((row) => row.key)
    );

    if (commandsRows.length === 0 || allPermissionKeys.size === 0) return;

    const existingRows = await command_permissions.findAll({
      attributes: ['commandId', 'permissionKey']
    });
    const existing = new Set(existingRows.map((row) => `${row.commandId}::${row.permissionKey}`));

    const inserts = [];
    for (const row of commandsRows) {
      let parsed = [];
      try {
        parsed = JSON.parse(row.permissions || '[]');
      } catch {
        parsed = [];
      }

      const keys = [...new Set((Array.isArray(parsed) ? parsed : [])
        .map((key) => String(key || '').trim())
        .filter((key) => key.length > 0 && allPermissionKeys.has(key)))];

      for (const permissionKey of keys) {
        const key = `${row.id}::${permissionKey}`;
        if (!existing.has(key)) {
          inserts.push({ commandId: row.id, permissionKey });
          existing.add(key);
        }
      }
    }

    if (inserts.length > 0) {
      await command_permissions.bulkCreate(inserts);
    }
  };

  return command_permissions;
};