export default (sequelize, DataTypes) => {
  const UserStats = sequelize.define('UserStats', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    statDefinitionId: { type: DataTypes.INTEGER, allowNull: false },
    value: { type: DataTypes.DECIMAL(20, 0), allowNull: false, defaultValue: 0 },
  }, {
    tableName: 'user_stats',
    timestamps: true,
    indexes: [
      { name: 'user_stats_user_stat_unique', unique: true, fields: ['userId', 'statDefinitionId'] },
      { name: 'user_stats_user_idx', fields: ['userId'] },
    ],
  });

  UserStats.associate = (models) => {
    UserStats.belongsTo(models.Users, { foreignKey: 'userId', as: 'user', constraints: false });
    UserStats.belongsTo(models.StatDefinitions, { foreignKey: 'statDefinitionId', as: 'statDefinition', constraints: false });
  };

  return UserStats;
};
