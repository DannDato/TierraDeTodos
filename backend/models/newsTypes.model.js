export default (sequelize, DataTypes) => {
  const news_types = sequelize.define('news_types', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#f59e0b'
    }
  }, {
    tableName: 'news_types',
    timestamps: false,
    indexes: [
      {
        name: 'news_types_name_unique',
        unique: true,
        fields: ['name']
      }
    ]
  });

  news_types.seed = async () => {
    const seedTypes = [
      { name: 'NOTICIA', description: 'Comunicado general del servidor', color: '#f59e0b' },
      { name: 'ANUNCIO', description: 'Avisos importantes y comunicados oficiales', color: '#22c55e' },
      { name: 'EVENTO', description: 'Eventos de comunidad y actividades especiales', color: '#a855f7' },
      { name: 'PARCHE', description: 'Cambios técnicos, fixes y actualizaciones', color: '#3b82f6' }
    ];

    const existing = await news_types.findAll({ attributes: ['name'] });
    const existingNames = new Set(existing.map((item) => String(item.name || '').toUpperCase()));

    const missing = seedTypes.filter((item) => !existingNames.has(String(item.name || '').toUpperCase()));
    if (missing.length > 0) {
      await news_types.bulkCreate(missing);
    }
  };

  return news_types;
};
