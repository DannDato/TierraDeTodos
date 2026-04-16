export default (sequelize, DataTypes) => {

  const Users = sequelize.define('Users', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'USER',
        allowNull: false
    },
    email: {
      type: DataTypes.STRING
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
        type: DataTypes.STRING,
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
      otherKey: 'permission',
      targetKey: 'key',
      as: 'permissions'
    });

    Users.hasMany(models.user_profile_images, {
      foreignKey: 'userId',
      as: 'profileImages'
    });
  };

  Users.seed = async () => {
    const validate = await Users.findAll();
    if (validate.length > 0) return;

    const seedUsers = [
      // 1. Tu usuario Admin original
      {
        username: 'danndato',
        role: 'ADMIN',
        email: 'danieltova97@gmail.com',
        password: '$2b$10$rQgptFOsAm1mZtZbRMEnreQBuWqs6VOdweNey4jwHqXkMmeeIrqrO',
        displayName: 'DannDato',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        mojang: 'PREMIUM',
        account: 'ACTIVE'
      },
      // 2. Un usuario VIP, activo y Premium
      {
        username: 'steve_tdt',
        role: 'VIP',
        email: 'steve@tierradetodos.com',
        password: '$2b$10$rQgptFOsAm1mZtZbRMEnreQBuWqs6VOdweNey4jwHqXkMmeeIrqrO',
        displayName: 'SteveTDT',
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        mojang: 'PREMIUM',
        account: 'ACTIVE'
      },
      // 3. Un Moderador para probar permisos intermedios
      {
        username: 'alex_mod',
        role: 'MODERATOR',
        email: 'alex@tierradetodos.com',
        password: '$2b$10$rQgptFOsAm1mZtZbRMEnreQBuWqs6VOdweNey4jwHqXkMmeeIrqrO',
        displayName: 'AlexGuard',
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        mojang: 'PREMIUM',
        account: 'ACTIVE'
      },
      // 4. Un usuario baneado (ideal para ver cómo reacciona el dashboard)
      {
        username: 'hacker_man',
        role: 'USER',
        email: 'hacker@darkweb.com',
        password: '$2b$10$rQgptFOsAm1mZtZbRMEnreQBuWqs6VOdweNey4jwHqXkMmeeIrqrO',
        displayName: 'HackerPro99',
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        mojang: 'NO-PREMIUM',
        account: 'BANNED'
      },
      // 5. Un usuario normal, pero inactivo (quizás no ha verificado su correo)
      {
        username: 'lazy_miner',
        role: 'USER',
        email: 'lazy@gmail.com',
        password: '$2b$10$rQgptFOsAm1mZtZbRMEnreQBuWqs6VOdweNey4jwHqXkMmeeIrqrO',
        displayName: 'LazyMiner',
        uuid: '550e8400-e29b-41d4-a716-446655440004',
        mojang: 'NO-PREMIUM',
        account: 'INACTIVE'
      },
      // 6. Un usuario normal completamente estándar
      {
        username: 'iron_golem',
        role: 'USER',
        email: 'golem@gmail.com',
        password: '$2b$10$rQgptFOsAm1mZtZbRMEnreQBuWqs6VOdweNey4jwHqXkMmeeIrqrO',
        displayName: 'IronGolem',
        uuid: '550e8400-e29b-41d4-a716-446655440005',
        mojang: 'PREMIUM',
        account: 'ACTIVE'
      }
    ];

    await Users.bulkCreate(seedUsers);
    console.log('🌱 Admin y 5 usuarios de prueba sembrados con éxito.');
  };

  return Users;
};