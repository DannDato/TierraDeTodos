export default (sequelize, DataTypes) => {

  const buildDeviceFolio = (id) => `DEV-${String(id).padStart(2, '0')}`;

  const UserDevices = sequelize.define('UserDevices', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    user: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    device_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },

    device_id: {
      type: DataTypes.STRING(128),
      allowNull: true
    },

    fingerprint_hash: {
      type: DataTypes.STRING(128),
      allowNull: true
    },

    fingerprint_version: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: 'v2'
    },

    folio: {
      type: DataTypes.STRING(24),
      allowNull: true
    },

    authorized: {
      type: DataTypes.ENUM('PENDING','AUTHORIZED','DENIED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },

    user_agent: {
      type: DataTypes.STRING,
      allowNull: true
    },

    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },

    accept_language: {
      type: DataTypes.STRING(128),
      allowNull: true
    },

    language: {
      type: DataTypes.STRING(32),
      allowNull: true
    },

    timezone: {
      type: DataTypes.STRING(64),
      allowNull: true
    },

    platform: {
      type: DataTypes.STRING(64),
      allowNull: true
    },

    browser: {
      type: DataTypes.STRING(64),
      allowNull: true
    },

    os: {
      type: DataTypes.STRING(64),
      allowNull: true
    },

    device_type: {
      type: DataTypes.STRING(32),
      allowNull: true
    },

    screen_resolution: {
      type: DataTypes.STRING(24),
      allowNull: true
    },

    color_depth: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    pixel_ratio: {
      type: DataTypes.STRING(16),
      allowNull: true
    },

    hardware_concurrency: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    device_memory: {
      type: DataTypes.STRING(16),
      allowNull: true
    },

    max_touch_points: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    fingerprint_metadata: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    first_login: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    last_login: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }

  },{
    tableName: 'user_devices',
    timestamps: false,
    indexes: [
      {
        name: 'user_devices_user_index',
        fields: ['user']
      },
      {
        name: 'user_devices_device_hash_index',
        fields: ['device_hash']
      },
      {
        name: 'user_devices_user_device_id_index',
        fields: ['user', 'device_id']
      },
      {
        name: 'user_devices_folio_unique',
        unique: true,
        fields: ['folio']
      }
    ]
  });

  UserDevices.addHook('afterCreate', async (device, options) => {
    if (device.folio) return;
    const folio = buildDeviceFolio(device.id);
    await device.update({ folio }, { transaction: options?.transaction, hooks: false });
  });

  UserDevices.seed = async () => {
    const rowsWithoutFolio = await UserDevices.findAll({
      attributes: ['id', 'folio'],
      where: { folio: null }
    });

    for (const row of rowsWithoutFolio) {
      const folio = buildDeviceFolio(row.id);
      await row.update({ folio }, { hooks: false });
    }
  };

  return UserDevices;
};
