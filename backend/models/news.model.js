export default (sequelize, DataTypes) => {
  const news = sequelize.define('news', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'NOTICIA'
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Reporter: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'reporter'
    }
  }, {
    tableName: 'news',
    timestamps: true,
    indexes: [
      {
        name: 'news_fecha_index',
        fields: ['fecha']
      },
      {
        name: 'news_type_index',
        fields: ['type']
      }
    ]
  });

  news.associate = (models) => {
    news.hasMany(models.news_comments, {
      foreignKey: 'newsId',
      as: 'comments'
    });
  };

  return news;
};
