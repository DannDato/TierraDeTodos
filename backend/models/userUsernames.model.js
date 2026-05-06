export default (sequelize, DataTypes) => {
  const UserUsernames = sequelize.define('UserUsernames', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    newUsername: {
      type: DataTypes.STRING,
      allowNull: false
    },
    verifyCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_usernames',
    timestamps: true
  });

  UserUsernames.associate = (models) => {
    UserUsernames.belongsTo(models.Users, { foreignKey: 'userId', as: 'user',
      constraints: false });
  };

  return UserUsernames;
};

