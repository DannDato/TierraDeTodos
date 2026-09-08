export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('user_connected_accounts', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    userId: { type: Sequelize.INTEGER, allowNull: false },
    provider: { type: Sequelize.STRING(32), allowNull: false },
    providerUserId: { type: Sequelize.STRING(255), allowNull: false },
    providerEmail: { type: Sequelize.STRING(255), allowNull: true },
    displayName: { type: Sequelize.STRING(255), allowNull: true },
    avatarUrl: { type: Sequelize.TEXT, allowNull: true },
    lastUsedAt: { type: Sequelize.DATE, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
  await queryInterface.addIndex('user_connected_accounts', ['provider', 'providerUserId'], { unique: true, name: 'connected_account_provider_user_unique' });
  await queryInterface.addIndex('user_connected_accounts', ['userId'], { name: 'connected_accounts_user_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('user_connected_accounts');
}