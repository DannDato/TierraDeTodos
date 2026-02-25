// session.model.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Session', {
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ip: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('PENDING','USED','ACTIVE','DISCONNECTED'),
      defaultValue: 'PENDING'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },{
    tableName: 'Session',
    timestamps: true 
});
};