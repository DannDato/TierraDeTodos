// Modelo: community
// Guarda información de comunidades creadas por streamers

export default (sequelize, DataTypes) => {
  const Community = sequelize.define('community', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    shortname: {
      type: DataTypes.STRING,
      allowNull: false
      // unique: true // Se maneja por índice
    },
    lider: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    color2: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#222222'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'community',
    timestamps: true,
    indexes: [
      {
        name: 'community_shortname_unique',
        unique: true,
        fields: ['shortname']
      }
    ]
  });

  Community.seed = async () => {
    const validate = await Community.findAll();
    if (validate.length > 0) return;
    await Community.bulkCreate([
      { id: 2, name: 'Lazytos', shortname: 'lazytos', lider: 5, color: '#00bdb0', color2: '#ffffff', description: 'Los  lazytos mas bonitos del condado', logo_url: 'https://descargas.dannprod.com/tdt-system/communities/5/logo_1778008349432.webp', createdAt: '2026-04-28T14:42:52.000Z', updatedAt: '2026-05-05T19:12:29.000Z' },
      { id: 3, name: 'locochones', shortname: 'locochones', lider: 6, color: '#ffffff', color2: '#ffffff', description: 'Los  lazytos mas bonitos del condado', logo_url: '', createdAt: '2026-04-28T14:42:52.000Z', updatedAt: '2026-04-28T14:42:52.000Z' },
      { id: 5, name: 'Datolovers', shortname: 'datotes', lider: 1, color: '#FFFFFF', color2: '#8f8f8f', description: 'asdadasdasdasdasd', logo_url: 'https://descargas.dannprod.com/tdt-system/communities/1/logo_1778008240719.gif', createdAt: '2026-05-04T22:18:28.000Z', updatedAt: '2026-05-05T19:10:41.000Z' },
      { id: 7, name: 'Comunidad Extra', shortname: 'extra', lider: 3, color: '#FFFFFF', color2: '#8f8f8f', description: 'asdadasdasdasdasd', logo_url: '', createdAt: '2026-05-04T22:18:28.000Z', updatedAt: '2026-05-05T19:10:41.000Z' },
      { id: 8, name: 'Azetianos', shortname: 'asasas', lider: 2, color: '#ffffff', color2: '#ffffff', description: 'Los  lazytos mas bonitos del condado', logo_url: '', createdAt: '2026-04-28T14:42:52.000Z', updatedAt: '2026-04-28T14:42:52.000Z' },
      { id: 9, name: 'Efesota', shortname: 'ede', lider: 4, color: '#FFFFFF', color2: '#8f8f8f', description: 'asdadasdasdasdasd', logo_url: '', createdAt: '2026-05-04T22:18:28.000Z', updatedAt: '2026-05-05T19:10:41.000Z' },
    ]);
  };

  Community.associate = (models) => {
    Community.belongsTo(models.Users, { foreignKey: 'lider', as: 'leader',
      constraints: false });
    Community.hasMany(models.user_community, { foreignKey: 'communityId', as: 'members',
      constraints: false });
    Community.hasMany(models.user_community_request, { foreignKey: 'communityId', as: 'requests',
      constraints: false });
  };

  return Community;
};

