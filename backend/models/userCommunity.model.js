// Modelo: user_community
// Relaciona usuarios con comunidades a las que pertenecen

export default (sequelize, DataTypes) => {
  const UserCommunity = sequelize.define('user_community', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    communityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_community',
    timestamps: false,
    indexes: [
      {
        name: 'user_community_community_index',
        fields: ['communityId']
      },
      {
        name: 'user_community_user_community_unique',
        unique: true,
        fields: ['userId', 'communityId']
      }
    ]
  });

  UserCommunity.associate = (models) => {
    UserCommunity.belongsTo(models.Users, { foreignKey: 'userId', as: 'user',
      constraints: false });
    UserCommunity.belongsTo(models.community, { foreignKey: 'communityId', as: 'community',
      constraints: false });
  };

  return UserCommunity;
};

