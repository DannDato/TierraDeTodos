export default (sequelize, DataTypes) => {
  const UserPasswords = sequelize.define('UserPasswords', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'User_passwords',
    timestamps: false,
    indexes: [
      { name: 'userpasswords_userId_index', fields: ['userId'] }
    ]
  });

  UserPasswords.associate = (models) => {
    UserPasswords.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      constraints: false
    });
  };

  return UserPasswords;
};

