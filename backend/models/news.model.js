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
      as: 'comments',
      constraints: false
    });
  };

  news.seed = async () => {
    const validate = await news.findAll();
    if (validate.length > 0) return;
    await news.bulkCreate([
      { id: 1, title: 'Que loco todo!', type: 'NOTICIA', fecha: '2026-04-23', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam vitae sapien in neque imperdiet accumsan quis porta tortor. Curabitur convallis viverra neque. Mauris nec blandit lorem, ac commodo sapien. Integer lacinia turpis sit amet lacus congue venenatis. Suspendisse potenti. In vel enim pretium, condimentum orci id, sodales purus. Nullam et vestibulum nibh, scelerisque sodales nisl. Donec tincidunt, diam et viverra ornare, eros lorem bibendum urna, quis venenatis enim nulla et lacus. Integer egestas faucibus est, vel tempor quam commodo sit amet. Proin lacinia cursus lectus, ut lobortis leo fermentum at. Donec nec pulvinar lectus, ut condimentum massa. Cras laoreet tortor metus, et pulvinar nisl mollis a.', image: 'https://descargas.dannprod.com/tdt-system/news/1/news_1777995281601.webp', note: null, Reporter: 'danndato', createdAt: '2026-04-23T18:40:56.000Z', updatedAt: '2026-05-05T15:34:42.000Z' },
      { id: 2, title: 'Se viene evento', type: 'EVENTO', fecha: '2026-04-23', description: 'Nullam in iaculis sapien. Duis et sodales ligula, eget ultricies mi. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum accumsan scelerisque posuere. Duis ut efficitur lorem, et varius elit. Nunc vitae gravida lorem. Sed vel finibus mauris, nec mattis nisi. Suspendisse enim lacus, sodales at libero ut, condimentum suscipit tortor. Nullam condimentum ipsum sed interdum ullamcorper. Fusce eget leo nec arcu aliquam fringilla. Quisque sollicitudin nec purus quis sagittis. Nulla dapibus enim neque, nec aliquam dolor imperdiet at. Sed id felis id est blandit consequat id in erat. Ut lectus odio, rhoncus et lobortis a, imperdiet eu massa.', image: null, note: null, Reporter: 'danndato', createdAt: '2026-04-23T18:40:56.000Z', updatedAt: '2026-04-23T18:40:56.000Z' },
      { id: 3, title: 'Ya lo arreglaron', type: 'PARCHE', fecha: '2026-04-23', description: 'Donec euismod, nunc non porttitor varius, risus orci dictum urna, vitae vestibulum dolor ex sed massa. Suspendisse nibh erat, dignissim id feugiat a, venenatis a ipsum. Integer eleifend ex neque. Donec dignissim metus quis rutrum posuere. Sed diam libero, efficitur eu mi pharetra, sagittis lobortis velit. Sed tempus urna mauris, id sagittis mauris pellentesque nec. Sed eu mattis enim. Suspendisse potenti. Nunc lacus purus, tempus non est quis, interdum efficitur metus.', image: 'https://descargas.dannprod.com/tdt-system/avatars/1/avatar_1777919484851.webp', note: null, Reporter: 'danndato', createdAt: '2026-04-23T18:40:56.000Z', updatedAt: '2026-04-23T18:40:56.000Z' },
      { id: 4, title: 'Noticia de prueba', type: 'EVENTO', fecha: '2026-04-23', description: 'Sed eu nunc mi. Praesent ut metus eget dui dictum ultricies. In fringilla nisi sed tortor tempus, ut pharetra dui rutrum. Maecenas feugiat ac turpis ut luctus. Donec hendrerit leo dolor, et porta nulla gravida eu. Morbi sit amet ante id ligula iaculis luctus quis et urna. Pellentesque a elit venenatis neque fermentum fermentum id et enim. Fusce ultrices tellus eget ligula maximus facilisis. Nam eget sem volutpat eros vestibulum sodales ut non elit. Suspendisse quis viverra dui. Quisque a tortor velit. Cras mollis elementum ornare. Vestibulum laoreet, quam et lobortis efficitur, ipsum velit gravida ligula, vitae varius justo leo non lacus.sdfsdfsd', image: 'https://descargas.dannprod.com/tdt-system/news/4/news_1778083332185.jpg', note: null, Reporter: 'danndato', createdAt: '2026-04-23T18:40:56.000Z', updatedAt: '2026-05-06T16:02:13.000Z' },
    ]);
  };

  return news;
};

