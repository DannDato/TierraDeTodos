export default (sequelize, DataTypes) => {

  const UserProfileImages = sequelize.define('user_profile_images', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    og_filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    img: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    pos_x: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 50
    },

    pos_y: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 50
    },

    zoom: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    tableName: 'user_profile_images',
    timestamps: true,
    indexes: [
      {
        name: 'user_profile_images_user_index',
        fields: ['userId']
      }
    ]
  });

  UserProfileImages.seed = async () => {
    const validate = await UserProfileImages.findAll();
    if (validate.length > 0) return;
    await UserProfileImages.bulkCreate([
      { id: 5, userId: 1, og_filename: '26tPgV8ceZTSxH9zG.webp', img: 'https://descargas.dannprod.com/tdt-system/avatars/1/avatar_1778008251368.webp', pos_x: 26, pos_y: 50, zoom: 1, createdAt: '2026-05-05T19:10:51.000Z', updatedAt: '2026-05-05T19:10:56.000Z' },
      { id: 6, userId: 5, og_filename: 'origen-del-meme.jpg.jpg', img: 'https://descargas.dannprod.com/tdt-system/avatars/5/avatar_1778008416988.jpg', pos_x: 38, pos_y: 60, zoom: 1.66, createdAt: '2026-05-05T19:13:37.000Z', updatedAt: '2026-05-05T19:13:46.000Z' },
    ]);
  };

  UserProfileImages.associate = (models) => {
    UserProfileImages.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      constraints: false
    });
    models.Users.hasOne(UserProfileImages, {
      foreignKey: 'userId',
      as: 'profileImage',
      constraints: false
    });
  };

  return UserProfileImages;
};

