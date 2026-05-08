export default (sequelize, DataTypes) => {
  const tickets = sequelize.define('tickets', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
      }
    ]
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

