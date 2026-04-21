export default (sequelize, DataTypes) => {
  const ticket_statuses = sequelize.define('ticket_statuses', {
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
    tableName: 'ticket_statuses',
    timestamps: false,
    indexes: [
      {
        name: 'ticket_statuses_key_unique',
        unique: true,
        fields: ['key']
      }
    ]
  });

  ticket_statuses.seed = async () => {
    const seedStatuses = [
      {
        key: 'ABIERTO',
        name: 'Abierto',
        detail: 'Ticket activo, en espera de atención o en proceso',
        color: '#22c55e',
        active: 'YES',
        immutable: true
      },
      {
        key: 'CERRADO',
        name: 'Cerrado',
        detail: 'Ticket resuelto y finalizado',
        color: '#8a8a8a',
        active: 'YES',
        immutable: true
      },
      {
        key: 'RECHAZADO',
        name: 'Rechazado',
        detail: 'Ticket rechazado por no cumplir requisitos o por ser inválido',
        color: '#ef4444',
        active: 'YES',
        immutable: true
      }
    ];

    const existing = await ticket_statuses.findAll({ attributes: ['key'] });
    const existingKeys = new Set(existing.map((item) => item.key));

    const missing = seedStatuses.filter((item) => !existingKeys.has(item.key));
    if (missing.length > 0) {
      await ticket_statuses.bulkCreate(missing);
    }

    await ticket_statuses.update(
      { immutable: true },
      { where: { key: seedStatuses.map((item) => item.key) } }
    );
  };

  return ticket_statuses;
};
