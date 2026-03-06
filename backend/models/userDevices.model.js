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
    tableName: 'UserDevices',
    timestamps: false,
    indexes: [
      {
        name: 'user_devices_user_index',
        fields: ['user']
      }
    ]
  });

  return UserDevices;
};