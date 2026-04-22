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
      unique: true,
      field: 'news_id'
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'news_likes',
    timestamps: true,
    indexes: [
      {
        name: 'news_likes_news_unique',
        unique: true,
        fields: ['news_id']
      },
      {
        name: 'news_likes_likes_idx',
        fields: ['likes']
      }
    ]
  });

  news_likes.associate = (models) => {
    news_likes.belongsTo(models.news, {
      foreignKey: 'newsId',
      as: 'news',
      onDelete: 'CASCADE'
    });
  };

  return news_likes;
};