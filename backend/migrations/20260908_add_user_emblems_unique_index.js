export async function up(queryInterface) {
  const indexes = await queryInterface.showIndex('user_emblems');
  const exists = indexes.some((index) => (
    index.name === 'user_emblems_user_emblem_unique'
    || index.unique && index.fields?.map((field) => field.attribute || field).join(',') === 'userId,emblemId'
  ));

  if (!exists) {
    await queryInterface.addIndex('user_emblems', ['userId', 'emblemId'], {
      unique: true,
      name: 'user_emblems_user_emblem_unique',
    });
  }
}

export async function down(queryInterface) {
  const indexes = await queryInterface.showIndex('user_emblems');
  if (indexes.some((index) => index.name === 'user_emblems_user_emblem_unique')) {
    await queryInterface.removeIndex('user_emblems', 'user_emblems_user_emblem_unique');
  }
}
