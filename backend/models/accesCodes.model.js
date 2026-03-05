export default (sequelize, DataTypes) => {

  const AccessCodes = sequelize.define('AccessCodes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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

    delivery_method: {
      type: DataTypes.STRING,
      allowNull: true
      // email | sms | whatsapp | app
    },

    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    max_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },

    is_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    timestamps: true
  });

  return AccessCodes;
};