export default (sequelize, DataTypes) => {

  const UserStatuses = sequelize.define('UserStatuses', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    status: {
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
      defaultValue: '#8a8a8a'
    },

    asignable: {
      type: DataTypes.ENUM('YES', 'NO'),
      allowNull: false,
      defaultValue: 'YES'
    },

    active: {
      type: DataTypes.ENUM('YES', 'NO'),
      allowNull: false,
      defaultValue: 'YES'
    }
  }, {
    tableName: 'UserStatuses',
    timestamps: false,
    indexes: [
      {
        name: 'userstatuses_status_unique',
        unique: true,
        fields: ['status']
      }
    ]
  });

  UserStatuses.seed = async () => {
    const validate = await UserStatuses.findAll();
    if (validate.length > 0) return;
    await UserStatuses.bulkCreate([
      { status: 'ACTIVE',   detail: 'Activo',     color: '#29d096', asignable: 'YES', active: 'YES' },
      { status: 'INACTIVE', detail: 'Inactivo',   color: '#ffc857', asignable: 'YES', active: 'YES' },
      { status: 'BANNED',   detail: 'Baneado',    color: '#ff3b30', asignable: 'YES', active: 'YES' },
      { status: 'BLOCKED',  detail: 'Bloqueado',  color: '#8a8a8a', asignable: 'YES', active: 'YES' },
    ]);
  };

  return UserStatuses;
};
