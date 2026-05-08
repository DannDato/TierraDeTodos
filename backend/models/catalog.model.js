export default (sequelize, DataTypes) => {
  const catalog = sequelize.define('catalog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    category: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    detail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#8a8a8a'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
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
    tableName: 'catalog',
    timestamps: false,
    indexes: [
      {
        name: 'catalog_category_key_unique',
        unique: true,
        fields: ['category', 'key']
      },
      {
        name: 'catalog_category_idx',
        fields: ['category']
      },
      {
        name: 'catalog_active_idx',
        fields: ['active']
      }
    ]
  });

  catalog.seed = async () => {
    const seedData = [
      // ticket_type
      { category: 'ticket_type', key: 'SOPORTE',       name: 'Soporte',           detail: 'Ayuda técnica o dudas generales',                 color: '#3b82f6', sortOrder: 1, active: 'YES', immutable: true },
      { category: 'ticket_type', key: 'REPORTE',       name: 'Reporte',           detail: 'Reporte general de conducta o situación',          color: '#f59e0b', sortOrder: 2, active: 'YES', immutable: true },
      { category: 'ticket_type', key: 'REPORTE_ROBO',  name: 'Reporte de robo',   detail: 'Incidentes de robo o pérdida por terceros',        color: '#ef4444', sortOrder: 3, active: 'YES', immutable: true },
      { category: 'ticket_type', key: 'PETICION',      name: 'Petición',          detail: 'Solicitud puntual para revisión del staff',        color: '#10b981', sortOrder: 4, active: 'YES', immutable: true },
      // ticket_status
      { category: 'ticket_status', key: 'ABIERTO',    name: 'Abierto',    detail: 'Ticket activo, en espera de atención o en proceso',       color: '#22c55e', sortOrder: 1, active: 'YES', immutable: true },
      { category: 'ticket_status', key: 'CERRADO',    name: 'Cerrado',    detail: 'Ticket resuelto y finalizado',                            color: '#8a8a8a', sortOrder: 2, active: 'YES', immutable: true },
      { category: 'ticket_status', key: 'RECHAZADO',  name: 'Rechazado',  detail: 'Ticket rechazado por no cumplir requisitos o inválido',   color: '#ef4444', sortOrder: 3, active: 'YES', immutable: true },
      // ticket_priority
      { category: 'ticket_priority', key: 'BAJA',    name: 'Baja',    detail: 'Sin impacto crítico, puede esperar',       color: '#22c55e', sortOrder: 1, active: 'YES', immutable: true },
      { category: 'ticket_priority', key: 'MEDIA',   name: 'Media',   detail: 'Requiere atención normal',                 color: '#f59e0b', sortOrder: 2, active: 'YES', immutable: true },
      { category: 'ticket_priority', key: 'ALTA',    name: 'Alta',    detail: 'Requiere atención prioritaria',            color: '#f97316', sortOrder: 3, active: 'YES', immutable: true },
      { category: 'ticket_priority', key: 'URGENTE', name: 'Urgente', detail: 'Atención inmediata por alto impacto',      color: '#ef4444', sortOrder: 4, active: 'YES', immutable: true },
      // news_type
      { category: 'news_type', key: 'NOTICIA',  name: 'Noticia',  detail: 'Comunicado general del servidor',                   color: '#f59e0b', sortOrder: 1, active: 'YES', immutable: true },
      { category: 'news_type', key: 'ANUNCIO',  name: 'Anuncio',  detail: 'Avisos importantes y comunicados oficiales',        color: '#22c55e', sortOrder: 2, active: 'YES', immutable: true },
      { category: 'news_type', key: 'EVENTO',   name: 'Evento',   detail: 'Eventos de comunidad y actividades especiales',     color: '#a855f7', sortOrder: 3, active: 'YES', immutable: true },
      { category: 'news_type', key: 'PARCHE',   name: 'Parche',   detail: 'Cambios técnicos, fixes y actualizaciones',         color: '#3b82f6', sortOrder: 4, active: 'YES', immutable: true }
    ];

    const existing = await catalog.findAll({ attributes: ['category', 'key'] });
    const existingSet = new Set(existing.map((item) => `${item.category}|${item.key}`));

    const missing = seedData.filter((item) => !existingSet.has(`${item.category}|${item.key}`));
    if (missing.length > 0) {
      await catalog.bulkCreate(missing);
    }

    // Asegurar immutable en semillas protegidas
    const categories = [...new Set(seedData.map((s) => s.category))];
    for (const cat of categories) {
      const keys = seedData.filter((s) => s.category === cat && s.immutable).map((s) => s.key);
      if (keys.length > 0) {
        await catalog.update({ immutable: true }, { where: { category: cat, key: keys } });
      }
    }
  };

  return catalog;
};

