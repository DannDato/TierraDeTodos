export default (sequelize, DataTypes) => {
  const goals = sequelize.define('goals', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    editionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    emblemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('kill', 'craft', 'explore', 'social', 'event', 'custom'),
      allowNull: false,
      defaultValue: 'custom'
    },
    targetValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    progressType: {
      type: DataTypes.ENUM('cumulative', 'single', 'boolean'),
      allowNull: false,
      defaultValue: 'cumulative'
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isRepeatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'goals',
    timestamps: true,
    indexes: [
      {
        name: 'goals_edition_index',
        fields: ['editionId']
      },
      {
        name: 'goals_emblem_index',
        fields: ['emblemId']
      },
      {
        name: 'goals_edition_title_unique',
        unique: true,
        fields: ['editionId', 'title']
      },
      {
        name: 'goals_type_progress_index',
        fields: ['type', 'progressType']
      },
      {
        name: 'goals_visibility_window_index',
        fields: ['isHidden', 'startDate', 'endDate']
      }
    ]
  });

  goals.associate = (models) => {
    goals.belongsTo(models.Edition, {
      foreignKey: 'editionId',
      as: 'edition',
      onDelete: 'CASCADE',
      constraints: false
    });

    goals.belongsTo(models.emblems, {
      foreignKey: 'emblemId',
      as: 'emblem',
      onDelete: 'CASCADE',
      constraints: false
    });

    goals.hasMany(models.user_goals, {
      foreignKey: 'goalId',
      as: 'user_goal_entries',
      constraints: false
    });

    goals.hasMany(models.user_emblems, {
      foreignKey: 'sourceGoalId',
      as: 'source_user_emblems',
      constraints: false
    });

    goals.belongsToMany(models.Users, {
      through: models.user_goals,
      foreignKey: 'goalId',
      otherKey: 'userId',
      as: 'users',
      constraints: false
    });
  };

  return goals;
};
