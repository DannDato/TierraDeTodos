export async function up(queryInterface) {
  await queryInterface.renameTable('system_settings', 'system_information');
}

export async function down(queryInterface) {
  await queryInterface.renameTable('system_information', 'system_settings');
}