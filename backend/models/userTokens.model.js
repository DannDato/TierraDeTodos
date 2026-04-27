export default (sequelize, DataTypes) => {
  const UserTokens = sequelize.define("UserTokens", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "password_recovery",
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: "user_tokens",
    timestamps: true,
    indexes: [
      {
        name: "user_tokens_token_unique",
        unique: true,
        fields: ["token"],
      },
    ],
  });

  UserTokens.associate = (models) => {
    UserTokens.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
  };


  return UserTokens;
};
