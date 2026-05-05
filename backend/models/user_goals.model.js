export default (sequelize, DataTypes) => {
  const user_goals = sequelize.define('user_goals', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    goalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'goals', key: 'id' }
    },
    editionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'edition', key: 'id' }
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_goals',
    timestamps: true,
    indexes: [
      {
        name: 'user_goals_user_goal_unique',
        unique: true,
        fields: ['userId', 'goalId']
      },
      {
        name: 'user_goals_edition_index',
        fields: ['editionId']
      },
      {
        name: 'user_goals_user_edition_index',
        fields: ['userId', 'editionId']
      },
      {
        name: 'user_goals_completion_index',
        fields: ['isCompleted', 'completedAt']
      }
    ]
  });

  user_goals.associate = (models) => {
    user_goals.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    user_goals.belongsTo(models.goals, {
      foreignKey: 'goalId',
      as: 'goal',
      onDelete: 'CASCADE'
    });

    user_goals.belongsTo(models.Edition, {
      foreignKey: 'editionId',
      as: 'edition',
      onDelete: 'CASCADE'
    });
  };

  return user_goals;
};