export default (sequelize, DataTypes) => sequelize.define('OAuthStates', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  stateHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  provider: { type: DataTypes.STRING(32), allowNull: false },
  mode: { type: DataTypes.STRING(16), allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  result: { type: DataTypes.TEXT, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'oauth_states',
  timestamps: true,
  indexes: [{ name: 'oauth_states_expiration_idx', fields: ['expiresAt'] }],
});
