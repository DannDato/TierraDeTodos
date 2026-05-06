export default (sequelize, DataTypes) => {
  const news_comments = sequelize.define('news_comments', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    newsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'news_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'news_comments',
    timestamps: true,
    indexes: [
      {
        name: 'news_comments_news_idx',
        fields: ['news_id']
      },
      {
        name: 'news_comments_user_idx',
        fields: ['user_id']
      }
    ]
  });

  news_comments.associate = (models) => {
    news_comments.belongsTo(models.news, {
      foreignKey: 'newsId',
      as: 'news',
      onDelete: 'CASCADE',
      constraints: false
    });

    news_comments.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      constraints: false
    });

    news_comments.hasMany(models.likes, {
      foreignKey: 'targetId',
      as: 'likes',
      constraints: false,
      scope: { targetType: 'news_comment' }
    });
  };

  return news_comments;
};
