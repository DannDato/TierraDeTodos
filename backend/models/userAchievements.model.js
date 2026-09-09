export default (sequelize, DataTypes) => {
  const UserAchievements = sequelize.define('UserAchievements', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    achievementId: { type: DataTypes.INTEGER, allowNull: false },
    progress: { type: DataTypes.DECIMAL(20, 0), allowNull: false, defaultValue: 0 },
    isReached: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    reachedAt: { type: DataTypes.DATE, allowNull: true },
    notifiedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'user_achievements',
    timestamps: true,
    indexes: [
      { name: 'user_achievements_user_achievement_unique', unique: true, fields: ['userId', 'achievementId'] },
      { name: 'user_achievements_user_idx', fields: ['userId'] },
    ],
  });

  UserAchievements.associate = (models) => {
    UserAchievements.belongsTo(models.Users, { foreignKey: 'userId', as: 'user', constraints: false });
    UserAchievements.belongsTo(models.Achievements, { foreignKey: 'achievementId', as: 'achievement', constraints: false });
  };

  UserAchievements.seed = async () => {
    const user = await sequelize.models.Users.findByPk(1);
    const achievement = await sequelize.models.Achievements.findOne({ where: { key: 'FIRST_LOGIN' } });
    if (!user || !achievement) return;

    await UserAchievements.findOrCreate({
      where: { userId: user.id, achievementId: achievement.id },
      defaults: {
        progress: achievement.goal,
        isReached: true,
        reachedAt: new Date(),
      },
    });
  };

  return UserAchievements;
};
