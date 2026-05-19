export default (sequelize, DataTypes) => {
  const tickets = sequelize.define('tickets', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    ticketCode: {
      type: DataTypes.STRING(48),
      allowNull: false,
      unique: true,
      field: 'ticket_code',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    typeKey: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'type_key'
    },
    priorityKey: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'priority_key'
    },
    statusKey: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ABIERTO',
      field: 'status_key'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    coordX: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'coord_x'
    },
    coordY: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'coord_y'
    },
    coordZ: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'coord_z'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    evidence: {
      type: DataTypes.STRING,
      allowNull: true
    }

  }, {
    modelName: 'tickets',
    tableName: 'tickets',
    timestamps: true,
    indexes: [
      {
        name: 'tickets_user_id_index',
        fields: ['user_id']
      },
      {
        name: 'tickets_status_key_index',
        fields: ['status_key']
      },
      {
        name: 'tickets_ticket_code_index',
        unique: true,
        fields: ['ticket_code']
      }
    ]
  });

  // Hook para generar ticket_code aleatorio y único
  tickets.beforeCreate(async (ticket, options) => {
    if (!ticket.ticketCode) {
      let code;
      let exists = true;
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      while (exists) {
        code = Array.from({ length: 32 }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
        // Verifica unicidad
        // eslint-disable-next-line no-await-in-loop
        exists = await tickets.findOne({ where: { ticketCode: code }, attributes: ['id'] });
      }
      ticket.ticketCode = code;
    }
  });

  tickets.associate = (models) => {
    tickets.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'author',
      constraints: false
    });

    tickets.hasMany(models.tickets_messages, {
      foreignKey: 'ticketId',
      as: 'messages',
      constraints: false
    });
  };

//   tickets.seed = async () => {
//     const existing = await tickets.findOne({ where: { subject: 'Ejemplo de ticket' } });
//     if (existing) return;
//     await tickets.bulkCreate([
//         { subject: 'Ejemplo de ticket', typeKey: 'GENERAL', priorityKey: 'MEDIA', statusKey: 'ABIERTO', description: 'Descripción del ticket de prueba', userId: 1, coordX: null, coordY: null, coordZ: null, evidence: null },
//         { subject: 'Ejemplo de ticket', typeKey: 'GENERAL', priorityKey: 'MEDIA', statusKey: 'ABIERTO', description: 'Descripción del ticket de prueba', userId: 2, coordX: null, coordY: null, coordZ: null, evidence: null },
//         { subject: 'Ejemplo de ticket', typeKey: 'GENERAL', priorityKey: 'MEDIA', statusKey: 'ABIERTO', description: 'Descripción del ticket de prueba', userId: 3, coordX: null, coordY: null, coordZ: null, evidence: null },
//         { subject: 'Ejemplo de ticket', typeKey: 'GENERAL', priorityKey: 'MEDIA', statusKey: 'ABIERTO', description: 'Descripción del ticket de prueba', userId: 4, coordX: null, coordY: null, coordZ: null, evidence: null },
//         { subject: 'Ejemplo de ticket', typeKey: 'GENERAL', priorityKey: 'MEDIA', statusKey: 'ABIERTO', description: 'Descripción del ticket de prueba', userId: 1, coordX: null, coordY: null, coordZ: null, evidence: null }
//       ]);
//     };

  return tickets;
};

