export default (sequelize, DataTypes) => {

  const AccessCodes = sequelize.define('AccessCodes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    codigo:{
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    device_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_used: {
      type: DataTypes.ENUM('USED','UNUSED'),
      defaultValue: 'UNUSED'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    }

  },{
    tableName: 'AccessCodes',
    timestamps: false
  });

  return AccessCodes;
};