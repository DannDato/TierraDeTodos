export default (sequelize, DataTypes) => {
  const tickets_prioritys = sequelize.define('tickets_prioritys', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    detail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#8a8a8a'
    },
    active: {
      type: DataTypes.ENUM('YES', 'NO'),
      allowNull: false,
      defaultValue: 'YES'
    },
    immutable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'tickets_prioritys',
    timestamps: false,
    indexes: [
      {
        name: 'tickets_prioritys_key_unique',
        unique: true,
        fields: ['key']
      }
    ]
  });

  tickets_prioritys.seed = async () => {
    const seedPriorities = [
      {
        key: 'BAJA',
        name: 'Baja',
        detail: 'Sin impacto crítico, puede esperar',
        color: '#22c55e',
        active: 'YES',
        immutable: true
      },
      {
        key: 'MEDIA',
        name: 'Media',
        detail: 'Requiere atención normal',
        color: '#f59e0b',
        active: 'YES',
        immutable: true
      },
      {
        key: 'ALTA',
        name: 'Alta',
        detail: 'Requiere atención prioritaria',
        color: '#f97316',
        active: 'YES',
        immutable: true
      },
      {
        key: 'URGENTE',
        name: 'Urgente',
        detail: 'Atención inmediata por alto impacto',
        color: '#ef4444',
        active: 'YES',
        immutable: true
      }
    ];

    const existing = await tickets_prioritys.findAll({ attributes: ['key'] });
    const existingKeys = new Set(existing.map((item) => item.key));

    const missing = seedPriorities.filter((item) => !existingKeys.has(item.key));

    if (missing.length > 0) {
      await tickets_prioritys.bulkCreate(missing);
    }
  };

  return tickets_prioritys;
};
