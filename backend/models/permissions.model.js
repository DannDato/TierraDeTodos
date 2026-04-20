export default (sequelize, DataTypes) => {

  const Permissions = sequelize.define('Permissions', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    key: {
      type: DataTypes.STRING,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'Permissions',
    timestamps: true,
    indexes: [
      {
        name: 'permissions_key_unique',
        unique: true,
        fields: ['key']
      }
    ]
  });

  Permissions.associate = (models) => {
    Permissions.belongsToMany(models.Users, {
      through: models.UserPermissions,
      foreignKey: 'permission',
      sourceKey: 'key',
      otherKey: 'userId',
      as: 'users'
    });
  };

  Permissions.seed = async () => {
    const seedPermissions = [
      { key: 'menu.start', name: 'Inicio', description: 'Permite ver Inicio', active: true },
      { key: 'menu.userscontrol', name: 'Control usuarios', description: 'Permite ver userscontrol', active: true },
      { key: 'menu.users', name: 'Usuarios', description: 'Permite ver users', active: true },
      { key: 'menu.profile', name: 'Perfil', description: 'Permite ver perfil', active: true },
      { key: 'menu.configuration', name: 'Configuración', description: 'Permite ver configuración', active: true },
      { key: 'menu.aboutapp', name: 'Acerca de', description: 'Permite ver about app', active: true },
      { key: 'menu.gestion', name: 'Gestión', description: 'Permite ver gestión de sistema', active: true },
      //derechos de gestion
      { key: 'gest.roles', name: 'Gestionar roles', description: 'Permite crear, editar y eliminar roles', active: true },
      { key: 'gest.permissions', name: 'Gestionar permisos', description: 'Permite crear, editar y eliminar permisos', active: true },
      { key: 'gest.statuses', name: 'Gestionar estatus', description: 'Permite crear, editar y eliminar estatus', active: true },
      { key: 'gest.editions', name: 'Gestionar ediciones', description: 'Permite crear, aperturar, cerrar y eliminar ediciones', active: true },
      { key: 'user.view', name: 'Ver usuarios', description: 'Permite ver la lista de usuarios y sus detalles', active: true },
      { key: 'user.edit', name: 'Editar usuarios', description: 'Permite modificar los datos de los usuarios, incluyendo roles y permisos', active: true }
    ];

    const existing = await Permissions.findAll({ attributes: ['key'] });
    const existingKeys = new Set(existing.map((permission) => permission.key));

    const missingPermissions = seedPermissions.filter((permission) => !existingKeys.has(permission.key));

    if (missingPermissions.length > 0) {
      await Permissions.bulkCreate(missingPermissions);
    }
  };

  return Permissions;
};
