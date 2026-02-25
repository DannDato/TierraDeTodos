
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('UserActionToken', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    type: {
      type: DataTypes.ENUM(
        'ACCOUNT_CONFIRMATION',
        'PASSWORD_RESET',
        'EMAIL_CHANGE'
      ),
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.ENUM(
        'USED',
        'NOT_USED',
      ),
      defaultValue: 'NOT_USED'
    },
    ipRequest: {
      type: DataTypes.STRING
    }

  }, {
    tableName: 'UserActionTokens',
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['expiresAt'] }
    ]
  });
};