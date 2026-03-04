export default (sequelize, DataTypes) => {

  const User = sequelize.define('Users', {
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
      allowNull: false
    },
    mojang: {
      type: DataTypes.ENUM('PREMIUM', 'NO-PREMIUM'),
      defaultValue: 'NO-PREMIUM'
    },
    account: { 
        type: DataTypes.ENUM('ACTIVE', 'BANNED', 'INACTIVE'),
        defaultValue: 'INACTIVE',
        allowNull: false
    },
  },{
    tableName: 'Users',
    timestamps: true
  });

  User.seed = async () => {
    const admin = await User.findOne({ where: { username: 'admin' } });

    if (!admin) {
      await User.create({
        username: 'danndato',
        rol: 'ADMIN',
        email:'danieltova97@gmail.com',
        password:'qwqwqw',
        displayName: 'DannDato',
        uuid: '00000000-0000-0000-0000-000000000000',
        mojang: 'PREMIUM',
        account: 'ACTIVE'
      });

      console.log('Admin creado');
    }
  };

  return User;
};