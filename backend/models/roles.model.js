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

    complementary: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#6b7280'
    },

    enfasis: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#111827'
    },

    extra: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#f5f5f5'
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
    Roles.hasMany(models.Users, {
      foreignKey: 'role',
      sourceKey: 'role',
      as: 'users',
      constraints: false
    });

    Roles.hasMany(models.PresetPermissions, {
      foreignKey: 'role',
      sourceKey: 'role',
      as: 'presetPermissions',
      constraints: false
    });
  };

  Roles.seed = async () => {
    const validate = await Roles.findAll();
    if (validate.length > 0) return;
    await Roles.bulkCreate([
      { role: 'SUPER-ADMIN', detail: 'Literalmente tiene el poder de todo, este es exclusivo de danndato', color: '#0d0d0d', complementary: '#ffffff', enfasis: '#c4913d', extra: '#383838', asignable: 'NO', active: 'YES' },
      { role: 'ADMIN', detail: 'Tiene grandes habilidades en el sistema', color: '#ffffff', complementary: '#0084ff', enfasis: '#141414', extra: '#e2e2e2', asignable: 'NO', active: 'YES' },
      { role: 'MOD', detail: 'Se le asignan pocas responsabilidades en el sistema', color: '#2f423a', complementary: '#838383', enfasis: '#ffffff', extra: '#2f423a', asignable: 'YES', active: 'YES' },
      { role: 'POLICE', detail: 'Tiene mas bien autoridad en el juego', color: '#4c83c8', complementary: '#838383', enfasis: '#ffffff', extra: '#4c83c8', asignable: 'YES', active: 'YES' },
      { role: 'STREAMER', detail: 'Puede gestionar su comunidad', color: '#68588d', complementary: '#b5b5b5', enfasis: '#ffffff', extra: '#68588d', asignable: 'YES', active: 'YES' },
      { role: 'USER', detail: 'Un simple mortal', color: '#ece1cb', complementary: '#6f6652', enfasis: '#1d1d1d', extra: '#b8a37a', asignable: 'YES', active: 'YES' },
      { role: 'VIP', detail: 'Un simple mortal VIP', color: '#ffffff', complementary: '#4f4f4f', enfasis: '#c4913d', extra: '#c4913d', asignable: 'YES', active: 'YES' },
      { role: 'PERIODISTA', detail: 'Puede gestionar noticias y comunicados', color: '#a1a1a1', complementary: '#121212', enfasis: '#000000', extra: '#b3b3b3', asignable: 'YES', active: 'YES' },
    ]);
  };

  return Roles;
};

