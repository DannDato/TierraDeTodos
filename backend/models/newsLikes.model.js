export default (sequelize, DataTypes) => {
  const news_likes = sequelize.define('news_likes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    newsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'news_id',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    }
  }, {
    tableName: 'news_likes',
    timestamps: true,
    indexes: [
      {
        name: 'news_likes_news_user_unique',
        unique: true,
        fields: ['news_id', 'user_id']
      },
      {
        name: 'news_likes_news_idx',
        fields: ['news_id']
      },
      {
        name: 'news_likes_user_idx',
        fields: ['user_id']
      }
    ]
  });

  news_likes.associate = (models) => {
    news_likes.belongsTo(models.news, {
      foreignKey: 'newsId',
      as: 'news',
      onDelete: 'CASCADE'
    });
    news_likes.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return news_likes;
};