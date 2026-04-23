// Modelo: community
// Guarda información de comunidades creadas por streamers

export default (sequelize, DataTypes) => {
  const Community = sequelize.define('community', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    shortname: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    lider: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    color2: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#222222'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'community',
    timestamps: true
  });

  Community.associate = (models) => {
    Community.belongsTo(models.Users, { foreignKey: 'lider', as: 'leader' });
    Community.hasMany(models.user_community, { foreignKey: 'communityId', as: 'members' });
    Community.hasMany(models.user_community_request, { foreignKey: 'communityId', as: 'requests' });
  };

  return Community;
};
