export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('information_fields', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    key: { type: Sequelize.STRING(80), allowNull: false, unique: true },
    label: { type: Sequelize.STRING(150), allowNull: false },
    description: { type: Sequelize.STRING(255), allowNull: true },
    dataType: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'text' },
    maxLength: { type: Sequelize.INTEGER, allowNull: true },
    required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    options: { type: Sequelize.JSON, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.createTable('user_information', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    userId: { type: Sequelize.INTEGER, allowNull: false },
    fieldId: { type: Sequelize.INTEGER, allowNull: false },
    value: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex('user_information', ['userId', 'fieldId'], { unique: true, name: 'user_information_user_field_unique' });
  await queryInterface.addIndex('user_information', ['userId'], { name: 'user_information_user_idx' });
  await queryInterface.addIndex('information_fields', ['enabled', 'order'], { name: 'information_fields_enabled_order_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('user_information');
  await queryInterface.dropTable('information_fields');
}
