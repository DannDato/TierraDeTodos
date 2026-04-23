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

  UserProfileImages.associate = (models) => {
    UserProfileImages.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
    models.Users.hasOne(UserProfileImages, {
      foreignKey: 'userId',
      as: 'profileImage',
    });
  };

  return UserProfileImages;
};
