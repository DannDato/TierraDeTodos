export default (sequelize, DataTypes) => {
  const user_emblems = sequelize.define('user_emblems', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    emblemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    editionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    earnedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    sourceGoalId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isEquipped: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'user_emblems',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: 'user_emblems_user_emblem_unique',
        unique: true,
        fields: ['userId', 'emblemId']
      },
      {
        name: 'user_emblems_edition_index',
        fields: ['editionId']
      },
      {
        name: 'user_emblems_user_edition_index',
        fields: ['userId', 'editionId']
      },
      {
        name: 'user_emblems_equipped_index',
        fields: ['userId', 'editionId', 'isEquipped']
      },
      {
        name: 'user_emblems_order_index',
        fields: ['userId', 'editionId', 'order']
      },
      {
        name: 'user_emblems_source_goal_index',
        fields: ['sourceGoalId']
      }
    ]
  });

  user_emblems.associate = (models) => {
    user_emblems.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      constraints: false
    });

    user_emblems.belongsTo(models.emblems, {
      foreignKey: 'emblemId',
      as: 'emblem',
      onDelete: 'CASCADE',
      constraints: false
    });

    user_emblems.belongsTo(models.Edition, {
      foreignKey: 'editionId',
      as: 'edition',
      onDelete: 'CASCADE',
      constraints: false
    });

    user_emblems.belongsTo(models.goals, {
      foreignKey: 'sourceGoalId',
      as: 'source_goal',
      onDelete: 'SET NULL',
      constraints: false
    });
  };

  return user_emblems;
};
