export default (sequelize, DataTypes) => {

  const Roles = sequelize.define('Roles', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false
    },

    detail: {
      type: DataTypes.STRING,
      allowNull: false
    },

    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#29d096'
    },

    asignable: {
      type: DataTypes.ENUM('YES', 'NO'),
      allowNull: true
    },

    active: {
      type: DataTypes.ENUM('YES', 'NO'),
      allowNull: true
    }
  }, {
    tableName: 'Roles',
    timestamps: false,
    indexes: [
      {
        name: 'roles_role_unique',
        unique: true,
        fields: ['role']
      }
    ]
  });

  Roles.associate = (models) => {
    Roles.belongsToMany(models.Users, {
      through: models.Users,
      foreignKey: 'roleId',
      otherKey: 'userId',
      as: 'users'
    });
  };

  Roles.seed = async () => {
    const validate = await Roles.findAll();
    if (validate.length > 0) return;
    await Roles.bulkCreate([
      { role: 'SUPER-ADMIN', detail: 'Super Administrador', color: '#ff3b30', asignable: 'NO', active: 'YES' },
      { role: 'ADMIN', detail: 'Administrador', color: '#ffffff', asignable: 'NO', active: 'YES' },
      { role: 'MOD', detail: 'Moderador', color: '#ff69d9', asignable: 'YES', active: 'YES' },
      { role: 'POLICE', detail: 'Policía', color: '#0073ff', asignable: 'YES', active: 'YES' },
      { role: 'STREAMER', detail: 'Streamer', color: '#b17dff', asignable: 'YES', active: 'YES' },
      { role: 'USER', detail: 'Usuario', color: '#29d096', asignable: 'YES', active: 'YES' },
      { role: 'VIP', detail: 'Usuario VIP', color: '#ffc857', asignable: 'YES', active: 'YES' }
    ]);
  };

  return Roles;
};
