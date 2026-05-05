export default (sequelize, DataTypes) => {
  const news_comments_likes = sequelize.define('news_comments_likes', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'comment_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    }
  }, {
    tableName: 'news_comments_likes',
    timestamps: true,
    indexes: [
      {
        name: 'news_comments_likes_comment_user_unique',
        unique: true,
        fields: ['comment_id', 'user_id']
      },
      {
        name: 'news_comments_likes_comment_idx',
        fields: ['comment_id']
      },
      {
        name: 'news_comments_likes_user_idx',
        fields: ['user_id']
      }
    ]
  });

  news_comments_likes.associate = (models) => {
    news_comments_likes.belongsTo(models.news_comments, {
      foreignKey: 'commentId',
      as: 'comment',
      onDelete: 'CASCADE'
    });
    news_comments_likes.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return news_comments_likes;
};
