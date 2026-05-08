export default (sequelize, DataTypes) => {
  const streamer = sequelize.define('streamer', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'streamer',
    timestamps: true,
    indexes: [
      {
        name: 'streamer_user_unique',
        unique: true,
        fields: ['userID'],
      },
    ],
  });

  streamer.associate = (models) => {
    streamer.belongsTo(models.Users, {
      foreignKey: 'userID',
      as: 'user',
      constraints: false
    });
    models.Users.hasOne(streamer, {
      foreignKey: 'userID',
      as: 'streamer',
      constraints: false
    });
  };

  return streamer;
};
