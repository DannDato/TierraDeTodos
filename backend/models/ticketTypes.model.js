export default (sequelize, DataTypes) => {
  const ticket_types = sequelize.define('ticket_types', {
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
    tableName: 'ticket_types',
    timestamps: false,
    indexes: [
      {
        name: 'ticket_types_key_unique',
        unique: true,
        fields: ['key']
      }
    ]
  });

  ticket_types.seed = async () => {
    const seedTypes = [
      {
        key: 'SOPORTE',
        name: 'Soporte',
        detail: 'Ayuda técnica o dudas generales',
        color: '#3b82f6',
        active: 'YES',
        immutable: true
      },
      {
        key: 'REPORTE',
        name: 'Reporte',
        detail: 'Reporte general de conducta o situación',
        color: '#f59e0b',
        active: 'YES',
        immutable: true
      },
      {
        key: 'REPORTE_ROBO',
        name: 'Reporte de robo',
        detail: 'Incidentes de robo o pérdida por terceros',
        color: '#ef4444',
        active: 'YES',
        immutable: true
      },
      {
        key: 'PETICION',
        name: 'Petición',
        detail: 'Solicitud puntual para revisión del staff',
        color: '#10b981',
        active: 'YES',
        immutable: true
      },
      {
        key: 'SUGERENCIA',
        name: 'Sugerencia',
        detail: 'Idea o mejora propuesta por el jugador',
        color: '#a855f7',
        active: 'YES',
        immutable: true
      },
      {
        key: 'BUG',
        name: 'Bug/Error',
        detail: 'Errores técnicos o comportamiento inesperado',
        color: '#8b5cf6',
        active: 'YES',
        immutable: true
      },
      {
        key: 'APELACION',
        name: 'Apelación',
        detail: 'Solicitud de revisión de sanción o baneo',
        color: '#f97316',
        active: 'YES',
        immutable: true
      }
    ];

    const existing = await ticket_types.findAll({ attributes: ['key'] });
    const existingKeys = new Set(existing.map((item) => item.key));

    const missing = seedTypes.filter((item) => !existingKeys.has(item.key));

    if (missing.length > 0) {
      await ticket_types.bulkCreate(missing);
    }
  };

  return ticket_types;
};
