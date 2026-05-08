// Modelo: user_community_request
// Postulaciones de usuarios para unirse a una comunidad, pendientes de aprobación

export default (sequelize, DataTypes) => {
  const UserCommunityRequest = sequelize.define('user_community_request', {
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
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'user_community_request',
    timestamps: false
  });

  UserCommunityRequest.associate = (models) => {
    UserCommunityRequest.belongsTo(models.Users, { foreignKey: 'userId', as: 'user',
      constraints: false });
    UserCommunityRequest.belongsTo(models.community, { foreignKey: 'communityId', as: 'community',
      constraints: false });
    UserCommunityRequest.belongsTo(models.Users, { foreignKey: 'reviewedBy', as: 'reviewer',
      constraints: false });
  };

  return UserCommunityRequest;
};

