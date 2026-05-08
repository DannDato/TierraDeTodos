// Migration: add color2 to community

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('community', 'color2', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: '#222222',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('community', 'color2');
}

