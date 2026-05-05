export default (sequelize, DataTypes) => {
  const emblems = sequelize.define('emblems', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    editionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'edition', key: 'id' }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    iconUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary', 'mythic'),
      allowNull: false,
      defaultValue: 'common'
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#9CA3AF'
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'emblems',
    timestamps: true,
    indexes: [
      {
        name: 'emblems_edition_index',
        fields: ['editionId']
      },
      {
        name: 'emblems_edition_name_unique',
        unique: true,
        fields: ['editionId', 'name']
      },
      {
        name: 'emblems_rarity_index',
        fields: ['rarity']
      },
      {
        name: 'emblems_active_hidden_index',
        fields: ['isActive', 'isHidden']
      }
    ]
  });

  emblems.associate = (models) => {
    emblems.belongsTo(models.Edition, {
      foreignKey: 'editionId',
      as: 'edition',
      onDelete: 'CASCADE'
    });

    emblems.hasMany(models.goals, {
      foreignKey: 'emblemId',
      as: 'goals'
    });

    emblems.hasMany(models.user_emblems, {
      foreignKey: 'emblemId',
      as: 'user_emblem_entries'
    });

    emblems.belongsToMany(models.Users, {
      through: models.user_emblems,
      foreignKey: 'emblemId',
      otherKey: 'userId',
      as: 'users'
    });
  };

  return emblems;
};