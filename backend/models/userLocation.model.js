export default (sequelize, DataTypes) => {
  const UserLocations = sequelize.define('UserLocations', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    ip: {
      type: DataTypes.STRING(45),
      allowNull: false
    },

    is_bogon: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    company: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },

    asn: {
      type: DataTypes.STRING(32),
      allowNull: true,
      defaultValue: null
    },

    city: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },

    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },

    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null
    },

    lon: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null
    },

    timezone: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'user_locations',
    timestamps: true,
    indexes: [
      {
        name: 'user_location_user_index',
        fields: ['userId']
      },
      {
        name: 'user_location_ip_index',
        fields: ['ip']
      }
    ]
  });

  UserLocations.associate = (models) => {
    UserLocations.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      constraints: false
    });

    models.Users.hasMany(UserLocations, {
      foreignKey: 'userId',
      as: 'locations',
      constraints: false
    });
  };

  return UserLocations;
};