export default (sequelize, DataTypes) => {

  const SystemStatuses = sequelize.define('system_statuses', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false
    },

    detail: {
      type: DataTypes.STRING,
      allowNull: false
    },

    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#8a8a8a'
    },

    asignable: {
      type: DataTypes.ENUM('YES', 'NO'),
      allowNull: false,
      defaultValue: 'YES'
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
    tableName: 'system_statuses',
    timestamps: false,
    indexes: [
      {
        name: 'systemstatuses_status_unique',
        unique: true,
        fields: ['status']
      }
    ]
  });

  SystemStatuses.seed = async () => {
    const seedStatuses = [
      { status: 'ACTIVE',   detail: 'Activo',     color: '#29d096', asignable: 'YES', active: 'YES', immutable: true },
      { status: 'INACTIVE', detail: 'Inactivo',   color: '#ffc857', asignable: 'YES', active: 'YES', immutable: true },
      { status: 'BANNED',   detail: 'Baneado',    color: '#ff3b30', asignable: 'YES', active: 'YES', immutable: true },
      { status: 'BLOCKED',  detail: 'Bloqueado',  color: '#8a8a8a', asignable: 'YES', active: 'YES', immutable: true },
    ];

    const existing = await SystemStatuses.findAll({ attributes: ['status'] });
    const existingStatuses = new Set(existing.map((item) => item.status));

    const missingStatuses = seedStatuses.filter((item) => !existingStatuses.has(item.status));
    if (missingStatuses.length > 0) {
      await SystemStatuses.bulkCreate(missingStatuses);
    }

    await SystemStatuses.update(
      { immutable: true },
      { where: { status: seedStatuses.map((item) => item.status) } }
    );
  };

  return SystemStatuses;
};

