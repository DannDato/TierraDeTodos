export default (sequelize, DataTypes) => {
  const emblems = sequelize.define('emblems', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    editionId: {
      type: DataTypes.INTEGER,
      allowNull: false
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

  emblems.seed = async () => {
    const validate = await emblems.findAll();
    if (validate.length > 0) return;
    await emblems.bulkCreate([
      { id: 1, editionId: 3, name: 'Puñito', description: 'Puñito para ver si sirve', iconUrl: 'https://descargas.dannprod.com/tdt-system/achievements/emblems/1/icon_1778011914911.png', rarity: 'epic', color: '#ff0000', isHidden: false, isActive: true, createdAt: '2026-05-05T20:12:23.000Z', updatedAt: '2026-05-05T20:12:23.000Z' },
      { id: 2, editionId: 3, name: 'Epico sisi', description: 'Emblema epico con fondo morado', iconUrl: 'https://descargas.dannprod.com/tdt-system/achievements/emblems/1/icon_1778012882198.png', rarity: 'epic', color: '#9900ff', isHidden: false, isActive: true, createdAt: '2026-05-05T20:23:35.000Z', updatedAt: '2026-05-05T20:28:05.000Z' },
      { id: 4, editionId: 3, name: 'asd', description: 'asd', iconUrl: 'https://descargas.dannprod.com/tdt-system/achievements/emblems/1/icon_1778012882198.png', rarity: 'epic', color: '#EEEEEE', isHidden: false, isActive: true, createdAt: '2026-05-05T20:23:35.000Z', updatedAt: '2026-05-05T20:28:05.000Z' },
    ]);
  };

  emblems.associate = (models) => {
    emblems.belongsTo(models.Edition, {
      foreignKey: 'editionId',
      as: 'edition',
      onDelete: 'CASCADE',
      constraints: false
    });

    emblems.hasMany(models.goals, {
      foreignKey: 'emblemId',
      as: 'goals',
      constraints: false
    });

    emblems.hasMany(models.user_emblems, {
      foreignKey: 'emblemId',
      as: 'user_emblem_entries',
      constraints: false
    });

    emblems.belongsToMany(models.Users, {
      through: models.user_emblems,
      foreignKey: 'emblemId',
      otherKey: 'userId',
      as: 'users',
      constraints: false
    });
  };

  return emblems;
};
