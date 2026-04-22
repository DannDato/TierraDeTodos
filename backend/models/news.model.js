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

    news.hasMany(models.news_likes, {
      foreignKey: 'newsId',
      as: 'likes'
    });
  };

  news.seed = async () => {
    const validate = await news.findAll();
    if (validate.length > 0) return;
    await news.bulkCreate([
        { title: 'Noticia de prueba', type: 'NOTICIA', fecha: new Date(), description: 'Descripción de la noticia de prueba', image: null, note: null, Reporter: 'Admin' },
        { title: 'Noticia de prueba', type: 'NOTICIA', fecha: new Date(), description: 'Descripción de la noticia de prueba', image: null, note: null, Reporter: 'Admin' },
        { title: 'Noticia de prueba', type: 'NOTICIA', fecha: new Date(), description: 'Descripción de la noticia de prueba', image: null, note: null, Reporter: 'Admin' },
        { title: 'Noticia de prueba', type: 'NOTICIA', fecha: new Date(), description: 'Descripción de la noticia de prueba', image: null, note: null, Reporter: 'Admin' }
      ]);
    };

  return news;
};
