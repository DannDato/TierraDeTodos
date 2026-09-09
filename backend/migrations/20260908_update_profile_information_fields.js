export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('information_fields', { key: 'location' });
  await queryInterface.bulkUpdate(
    'information_fields',
    {
      dataType: 'text',
      description: 'Escribe tu juego favorito.',
      maxLength: 120,
      options: null,
      updatedAt: new Date(),
    },
    { key: 'favorite_game' }
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkUpdate(
    'information_fields',
    {
      dataType: 'select',
      description: 'Elige una opción.',
      maxLength: 60,
      options: JSON.stringify({ choices: ['Minecraft', 'Terraria', 'Stardew Valley', 'Otro'] }),
      updatedAt: new Date(),
    },
    { key: 'favorite_game' }
  );
  await queryInterface.bulkInsert('information_fields', [{
    key: 'location',
    label: 'Ubicación',
    description: 'Ciudad o país donde vives.',
    dataType: 'text',
    maxLength: 120,
    required: false,
    enabled: true,
    order: 20,
    options: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }]);
}