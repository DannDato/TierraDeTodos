export default (sequelize, DataTypes) => {

  const Users = sequelize.define('Users', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('ADMIN', 'MOD','POLICE','STREAMER','USER'),
        defaultValue: 'USER',
        allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    password: {
      type: DataTypes.STRING
    },
    displayName: {
      type: DataTypes.STRING
    },
    uuid: {
      type: DataTypes.STRING,
    },
    mojang: {
      type: DataTypes.ENUM('PREMIUM', 'NO-PREMIUM'),
      defaultValue: 'NO-PREMIUM'
    },
    account: { 
        type: DataTypes.ENUM('ACTIVE', 'BANNED', 'INACTIVE', 'BLOCKED'),
        defaultValue: 'INACTIVE',
        allowNull: false
    },
  },{
    tableName: 'Users',
    timestamps: true,
    indexes: [
      {
        name: 'users_username_unique',
        unique: true,
        fields: ['username']
      },
      {
        name: 'users_email_unique',
        unique: true,
        fields: ['email']
      }
    ]
  });

  Users.associate = (models) => {
    Users.belongsToMany(models.Permissions, {
      through: models.UserPermissions,
      foreignKey: 'userId',
      otherKey: 'permissionId',
      as: 'permissions'
    });
  };

  Users.seed = async () => {
    const validate  = await Users.findAll();
    if(validate.length > 0) return;
    await Users.create({
      username: 'danndato',
      rol: 'ADMIN',
      email:'danieltova97@gmail.com',
      password:'$2b$10$rQgptFOsAm1mZtZbRMEnreQBuWqs6VOdweNey4jwHqXkMmeeIrqrO',
      displayName: 'DannDato',
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      mojang: 'PREMIUM',
      account: 'ACTIVE'
    });
    console.log('Admin creado');
  };

  return Users;
};