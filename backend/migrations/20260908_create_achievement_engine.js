export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('stat_definitions', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    key: { type: Sequelize.STRING(80), allowNull: false, unique: true },
    name: { type: Sequelize.STRING(150), allowNull: false },
    description: { type: Sequelize.STRING(255), allowNull: true },
    dataType: { type: Sequelize.ENUM('NUMBER', 'BOOLEAN'), allowNull: false, defaultValue: 'NUMBER' },
    aggregation: { type: Sequelize.ENUM('INCREMENT', 'SET'), allowNull: false, defaultValue: 'INCREMENT' },
    isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.createTable('achievements', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    key: { type: Sequelize.STRING(100), allowNull: false, unique: true },
    name: { type: Sequelize.STRING(150), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: false },
    hint: { type: Sequelize.STRING(255), allowNull: true },
    type: { type: Sequelize.ENUM('STAT', 'CUSTOM'), allowNull: false, defaultValue: 'STAT' },
    rarity: { type: Sequelize.ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'), allowNull: false, defaultValue: 'COMMON' },
    goal: { type: Sequelize.DECIMAL(20, 0), allowNull: false, defaultValue: 1 },
    operator: { type: Sequelize.ENUM('GTE', 'LTE', 'EQ'), allowNull: true },
    statDefinitionId: { type: Sequelize.INTEGER, allowNull: true },
    isSecret: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    isRepeatable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    icon: { type: Sequelize.STRING(500), allowNull: true },
    sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    prizeEmblemId: { type: Sequelize.INTEGER, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.createTable('user_stats', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    userId: { type: Sequelize.INTEGER, allowNull: false },
    statDefinitionId: { type: Sequelize.INTEGER, allowNull: false },
    value: { type: Sequelize.DECIMAL(20, 0), allowNull: false, defaultValue: 0 },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.createTable('user_achievements', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    userId: { type: Sequelize.INTEGER, allowNull: false },
    achievementId: { type: Sequelize.INTEGER, allowNull: false },
    progress: { type: Sequelize.DECIMAL(20, 0), allowNull: false, defaultValue: 0 },
    isReached: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    reachedAt: { type: Sequelize.DATE, allowNull: true },
    notifiedAt: { type: Sequelize.DATE, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.addIndex('user_stats', ['userId', 'statDefinitionId'], { unique: true, name: 'user_stats_user_stat_unique' });
  await queryInterface.addIndex('user_stats', ['userId'], { name: 'user_stats_user_idx' });
  await queryInterface.addIndex('user_achievements', ['userId', 'achievementId'], { unique: true, name: 'user_achievements_user_achievement_unique' });
  await queryInterface.addIndex('user_achievements', ['userId'], { name: 'user_achievements_user_idx' });
  await queryInterface.addIndex('achievements', ['isActive', 'sortOrder'], { name: 'achievements_active_order_idx' });
  await queryInterface.addIndex('achievements', ['statDefinitionId'], { name: 'achievements_stat_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('user_achievements');
  await queryInterface.dropTable('user_stats');
  await queryInterface.dropTable('achievements');
  await queryInterface.dropTable('stat_definitions');
}
