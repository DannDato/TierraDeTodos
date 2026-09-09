export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('community', 'flag_pattern', {
    type: Sequelize.STRING(32),
    allowNull: false,
    defaultValue: 'horizontal',
  });

  await queryInterface.addColumn('community', 'text_color', {
    type: Sequelize.STRING(7),
    allowNull: false,
    defaultValue: '#f2dfbf',
  });

  await queryInterface.addColumn('community', 'emblem_url', {
    type: Sequelize.STRING(2048),
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('community', 'emblem_url');
  await queryInterface.removeColumn('community', 'text_color');
  await queryInterface.removeColumn('community', 'flag_pattern');
}