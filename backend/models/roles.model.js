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
      { role: 'SUPER-ADMIN', detail: 'Literalmente tiene el poder de todo, este es exclusivo de danndato', color: '#ff3b30', asignable: 'NO', active: 'YES' },
      { role: 'ADMIN', detail: 'Tiene grandes habilidades en el sistema', color: '#ffffff', asignable: 'NO', active: 'YES' },
      { role: 'MOD', detail: 'Se le asignan pocas responsabilidades en el sistema', color: '#ff69d9', asignable: 'YES', active: 'YES' },
      { role: 'POLICE', detail: 'Tiene mas bien autoridad en el juego', color: '#0073ff', asignable: 'YES', active: 'YES' },
      { role: 'STREAMER', detail: 'Puede gestionar su comunidad', color: '#b17dff', asignable: 'YES', active: 'YES' },
      { role: 'USER', detail: 'Un simple mortal', color: '#29d096', asignable: 'YES', active: 'YES' },
      { role: 'VIP', detail: 'Un simple mortal VIP', color: '#ffc857', asignable: 'YES', active: 'YES' }
    ]);
  };

  return Roles;
};
