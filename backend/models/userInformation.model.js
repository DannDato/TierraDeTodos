export default (sequelize, DataTypes) => {
  const UserInformation = sequelize.define('UserInformation', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    fieldId: { type: DataTypes.INTEGER, allowNull: false },
    value: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'user_information',
    timestamps: true,
    indexes: [
      { name: 'user_information_user_field_unique', unique: true, fields: ['userId', 'fieldId'] },
      { name: 'user_information_user_idx', fields: ['userId'] },
    ],
  });

  UserInformation.associate = (models) => {
    UserInformation.belongsTo(models.Users, { foreignKey: 'userId', as: 'user', constraints: false });
    UserInformation.belongsTo(models.InformationFields, { foreignKey: 'fieldId', as: 'field', constraints: false });
  };

  return UserInformation;
};
