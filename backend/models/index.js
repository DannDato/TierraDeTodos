const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Importar modelos
const User = require('./user.model')(sequelize, DataTypes);
const Session = require('./session.model')(sequelize, DataTypes);
const ModpackVersion = require('./modpackVersion.model')(sequelize, DataTypes);
const UserActionToken = require('./userActionToken.model')(sequelize, DataTypes);


// Usuario tiene varias sesiones
User.hasMany(Session, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});
Session.belongsTo(User, {
  foreignKey: 'userId'
});

// Usuario tiene varios tokens de acción
User.hasMany(UserActionToken, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});
UserActionToken.belongsTo(User, {
  foreignKey: 'userId'
});


module.exports = {
  sequelize,
  Sequelize,
  User,
  Session,
  ModpackVersion,
  UserActionToken
};