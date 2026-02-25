
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Users', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('ROLE_ADMIN', 'ROLE_MOD','ROLE_POLICE','ROLE_STREAMER','ROLE_USER'),
        defaultValue: 'ROLE_USER',
        allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    password: {
      type: DataTypes.STRING
    },
    displayName: {
      type: DataTypes.STRING
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    account: { 
        type: DataTypes.ENUM('ACTIVE', 'BANNED', 'INACTIVE'),
        defaultValue: 'INACTIVE',
        allowNull: false
    },
  },{
    tableName: 'Users',
    timestamps: true,
    indexes: [
      { fields: ['username'] },
      { fields: ['rol'] },
      { fields: ['account'] }
    ]
  });
};