export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('notifications', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    key: { type: Sequelize.STRING(180), allowNull: true, unique: true },
    type: { type: Sequelize.ENUM('SYSTEM', 'NEWS', 'MODERATION', 'TICKET', 'MENTION', 'ACHIEVEMENT', 'EMBLEM', 'ACCOUNT', 'EVENT', 'SECURITY'), allowNull: false },
    category: { type: Sequelize.STRING(60), allowNull: true },
    title: { type: Sequelize.STRING(180), allowNull: false },
    message: { type: Sequelize.TEXT, allowNull: false },
    priority: { type: Sequelize.ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL'), allowNull: false, defaultValue: 'NORMAL' },
    entityType: { type: Sequelize.STRING(60), allowNull: true },
    entityId: { type: Sequelize.INTEGER, allowNull: true },
    actionType: { type: Sequelize.STRING(40), allowNull: true },
    actionTarget: { type: Sequelize.STRING(500), allowNull: true },
    icon: { type: Sequelize.STRING(120), allowNull: true },
    metadata: { type: Sequelize.JSON, allowNull: true },
    isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    startsAt: { type: Sequelize.DATE, allowNull: true },
    expiresAt: { type: Sequelize.DATE, allowNull: true },
    createdBy: { type: Sequelize.INTEGER, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.createTable('user_notifications', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    userId: { type: Sequelize.INTEGER, allowNull: false },
    notificationId: { type: Sequelize.INTEGER, allowNull: false },
    deliveredAt: { type: Sequelize.DATE, allowNull: false },
    seenAt: { type: Sequelize.DATE, allowNull: true },
    readAt: { type: Sequelize.DATE, allowNull: true },
    archivedAt: { type: Sequelize.DATE, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.addIndex('user_notifications', ['userId', 'notificationId'], { unique: true, name: 'user_notifications_user_notification_unique' });
  await queryInterface.addIndex('user_notifications', ['userId', 'readAt', 'archivedAt'], { name: 'user_notifications_user_read_idx' });
  await queryInterface.addIndex('notifications', ['isActive', 'startsAt', 'expiresAt'], { name: 'notifications_active_window_idx' });
  await queryInterface.addIndex('notifications', ['entityType', 'entityId'], { name: 'notifications_entity_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('user_notifications');
  await queryInterface.dropTable('notifications');
}
