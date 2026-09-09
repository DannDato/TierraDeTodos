export default (sequelize, DataTypes) => {
  const UserNotifications = sequelize.define('UserNotifications', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    notificationId: { type: DataTypes.INTEGER, allowNull: false },
    deliveredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    seenAt: { type: DataTypes.DATE, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'user_notifications',
    timestamps: true,
    indexes: [
      { name: 'user_notifications_user_notification_unique', unique: true, fields: ['userId', 'notificationId'] },
      { name: 'user_notifications_user_read_idx', fields: ['userId', 'readAt', 'archivedAt'] },
    ],
  });

  UserNotifications.associate = (models) => {
    UserNotifications.belongsTo(models.Users, { foreignKey: 'userId', as: 'user', constraints: false });
    UserNotifications.belongsTo(models.Notifications, { foreignKey: 'notificationId', as: 'notification', constraints: false });
  };

  return UserNotifications;
};
