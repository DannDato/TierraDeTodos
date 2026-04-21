export default (sequelize, DataTypes) => {
  const tickets_messages = sequelize.define('tickets_messages', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ticket_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    authorUsername: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'author_username'
    },
    authorRole: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'author_role'
    },
    sourceScreen: {
      type: DataTypes.ENUM('TICKETS', 'REPORTS'),
      allowNull: false,
      defaultValue: 'TICKETS',
      field: 'source_screen'
    },
    seenByUser: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'seen_by_user'
    },
    seenByAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'seen_by_admin'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'tickets_messages',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: 'tickets_messages_ticket_id_index',
        fields: ['ticket_id']
      }
    ]
  });

  tickets_messages.associate = (models) => {
    tickets_messages.belongsTo(models.tickets, {
      foreignKey: 'ticket_id',
      as: 'ticket'
    });

    tickets_messages.belongsTo(models.Users, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return tickets_messages;
};
