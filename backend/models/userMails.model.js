export default (sequelize, DataTypes) => {
  const UserMails = sequelize.define('UserMails', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    newEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    verifyCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'user_mails',
    timestamps: true
  });

  UserMails.associate = (models) => {
    UserMails.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
  };

  return UserMails;
};
