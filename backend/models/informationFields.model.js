export default (sequelize, DataTypes) => {
  const InformationFields = sequelize.define('InformationFields', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    dataType: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'text' },
    maxLength: { type: DataTypes.INTEGER, allowNull: true },
    required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    options: { type: DataTypes.JSON, allowNull: true },
  }, {
    tableName: 'information_fields',
    timestamps: true,
    indexes: [{ name: 'information_fields_enabled_order_idx', fields: ['enabled', 'order'] }],
  });

  InformationFields.associate = (models) => {
    InformationFields.hasMany(models.UserInformation, { foreignKey: 'fieldId', as: 'values', constraints: false });
  };

  InformationFields.seed = async () => {
    const fields = [
      { key: 'bio', label: 'Biografía', description: 'Cuéntale algo a la comunidad sobre ti.', dataType: 'textarea', maxLength: 500, order: 10, options: null },
      { key: 'website', label: 'Sitio web', description: 'Tu página personal o proyecto.', dataType: 'url', maxLength: 255, order: 30, options: null },
      { key: 'favorite_game', label: 'Juego favorito', description: 'Escribe tu juego favorito.', dataType: 'text', maxLength: 120, order: 40, options: null },
      { key: 'birth_date', label: 'Fecha de nacimiento', description: 'Información opcional para tu perfil.', dataType: 'date', maxLength: null, order: 50, options: null },
      { key: 'community_updates', label: 'Recibir novedades de la comunidad', description: 'Indica si deseas recibir novedades.', dataType: 'boolean', maxLength: null, order: 60, options: null },
    ];

    for (const field of fields) {
      await InformationFields.findOrCreate({ where: { key: field.key }, defaults: { ...field, required: false, enabled: true } });
    }
  };

  return InformationFields;
};
