export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('oauth_states', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    stateHash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
    provider: { type: Sequelize.STRING(32), allowNull: false },
    mode: { type: Sequelize.STRING(16), allowNull: false },
    userId: { type: Sequelize.INTEGER, allowNull: true },
    result: { type: Sequelize.TEXT, allowNull: true },
    expiresAt: { type: Sequelize.DATE, allowNull: false },
    used: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
  await queryInterface.addIndex('oauth_states', ['expiresAt'], { name: 'oauth_states_expiration_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('oauth_states');
}