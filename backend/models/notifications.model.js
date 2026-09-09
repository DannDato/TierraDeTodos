export default (sequelize, DataTypes) => {
  const Notifications = sequelize.define('Notifications', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(180), allowNull: true, unique: true },
    type: { type: DataTypes.ENUM('SYSTEM', 'NEWS', 'MODERATION', 'TICKET', 'MENTION', 'ACHIEVEMENT', 'EMBLEM', 'ACCOUNT', 'EVENT', 'SECURITY'), allowNull: false },
    category: { type: DataTypes.STRING(60), allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    priority: { type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL'), allowNull: false, defaultValue: 'NORMAL' },
    entityType: { type: DataTypes.STRING(60), allowNull: true },
    entityId: { type: DataTypes.INTEGER, allowNull: true },
    actionType: { type: DataTypes.STRING(40), allowNull: true },
    actionTarget: { type: DataTypes.STRING(500), allowNull: true },
    icon: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { name: 'notifications_active_window_idx', fields: ['isActive', 'startsAt', 'expiresAt'] },
      { name: 'notifications_entity_idx', fields: ['entityType', 'entityId'] },
    ],
  });

  Notifications.associate = (models) => {
    Notifications.hasMany(models.UserNotifications, { foreignKey: 'notificationId', as: 'deliveries', constraints: false });
    Notifications.belongsTo(models.Users, { foreignKey: 'createdBy', as: 'creator', constraints: false });
  };

  Notifications.seed = async () => {
    const user = await sequelize.models.Users.findByPk(1);
    if (!user) return;

    const samples = [
      {
        key: 'SEED_NOTIFICATION_ACHIEVEMENT_1',
        type: 'ACHIEVEMENT',
        category: 'achievements',
        title: '¡Logro desbloqueado!',
        message: 'Has completado tu primer acceso a Tierra de Todos.',
        priority: 'NORMAL',
        entityType: 'ACHIEVEMENT',
        entityId: 1,
        actionTarget: '/progress',
        icon: 'Award',
        metadata: { seed: true, achievementKey: 'FIRST_LOGIN' },
      },
      {
        key: 'SEED_NOTIFICATION_NEWS_1',
        type: 'NEWS',
        category: 'news',
        title: 'Nueva noticia publicada',
        message: 'Hay novedades de Tierra de Todos para revisar.',
        priority: 'LOW',
        entityType: 'NEWS',
        entityId: 1,
        actionTarget: '/news',
        icon: 'Newspaper',
        metadata: { seed: true },
      },
      {
        key: 'SEED_NOTIFICATION_TICKET_1',
        type: 'TICKET',
        category: 'tickets',
        title: 'Prueba de notificaciones',
        message: 'Esta notificación sirve para comprobar el estado leído/no leído.',
        priority: 'HIGH',
        entityType: 'TICKET',
        entityId: 1,
        actionTarget: '/tickets',
        icon: 'MessageSquareWarning',
        metadata: { seed: true },
      },
    ];

    for (const sample of samples) {
      const [notification] = await Notifications.findOrCreate({ where: { key: sample.key }, defaults: sample });
      const [delivery] = await sequelize.models.UserNotifications.findOrCreate({
        where: { userId: user.id, notificationId: notification.id },
        defaults: { deliveredAt: new Date() },
      });

      if (sample.key === 'SEED_NOTIFICATION_NEWS_1' && !delivery.readAt) {
        await delivery.update({ seenAt: new Date(), readAt: new Date() });
      }
    }
  };

  return Notifications;
};
