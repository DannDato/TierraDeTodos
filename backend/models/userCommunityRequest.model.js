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
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    communityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'community', key: 'id' }
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
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    }
  }, {
    tableName: 'user_community_request',
    timestamps: false
  });

  UserCommunityRequest.associate = (models) => {
    UserCommunityRequest.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
    UserCommunityRequest.belongsTo(models.community, { foreignKey: 'communityId', as: 'community' });
    UserCommunityRequest.belongsTo(models.Users, { foreignKey: 'reviewedBy', as: 'reviewer' });
  };

  return UserCommunityRequest;
};
