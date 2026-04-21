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
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    communityName: {
      type: DataTypes.STRING,
      allowNull: false,
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
    });
  };

  return streamer;
};