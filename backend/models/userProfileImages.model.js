export default (sequelize, DataTypes) => {

  const UserProfileImages = sequelize.define('UserProfileImages', {
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
  };

  return UserProfileImages;
};
