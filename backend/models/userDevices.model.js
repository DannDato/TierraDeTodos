export default (sequelize, DataTypes) => {

  const UserDevices = sequelize.define('UserDevices', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    user: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users', // nombre de la tabla
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },

    device_hash: {
      type: DataTypes.STRING,
      allowNull: false
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
        name: 'user_devices_folio_unique',
        unique: true,
        fields: ['folio']
      }
    ]
  });

  UserDevices.addHook('afterCreate', async (device, options) => {
    if (device.folio) return;
    const folio = `DEV-${String(device.id).padStart(8, '0')}`;
    await device.update({ folio }, { transaction: options?.transaction, hooks: false });
  });

  UserDevices.seed = async () => {
    const rowsWithoutFolio = await UserDevices.findAll({
      attributes: ['id', 'folio'],
      where: { folio: null }
    });

    for (const row of rowsWithoutFolio) {
      const folio = `DEV-${String(row.id).padStart(8, '0')}`;
      await row.update({ folio }, { hooks: false });
    }
  };

  return UserDevices;
};