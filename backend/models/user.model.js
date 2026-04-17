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
    folio: {
      type: DataTypes.STRING(32),
      allowNull: true
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
      },
      {
        name: 'users_folio_unique',
        unique: true,
        fields: ['folio']
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

    Users.hasMany(models.UserEdition, {
      foreignKey: 'userID',
      as: 'editions'
    });

    Users.belongsToMany(models.Edition, {
      through: models.UserEdition,
      foreignKey: 'userID',
      otherKey: 'editionId',
      as: 'editionsList'
    });
  };

  Users.seed = async () => {
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
        account: 'ACTIVE',
        folio: 'TDT-00000001'
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
        account: 'ACTIVE',
        folio: 'TDT-00000002'
      },
      // 3. Un Moderador para probar permisos intermedios
      {
        username: 'alex_mod',
        role: 'MOD',
        email: 'alex@tierradetodos.com',
        password: '$2b$10$rQgptFOsAm1mZtZbRMEnreQBuWqs6VOdweNey4jwHqXkMmeeIrqrO',
        displayName: 'AlexGuard',
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        mojang: 'PREMIUM',
        account: 'ACTIVE',
        folio: 'TDT-00000003'
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
        account: 'BANNED',
        folio: 'TDT-00000004'
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
        account: 'INACTIVE',
        folio: 'TDT-00000005'
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
        account: 'ACTIVE',
        folio: 'TDT-00000006'
      }
    ];

    for (const seedUser of seedUsers) {
      const existingUser = await Users.findOne({ where: { username: seedUser.username } });
      if (!existingUser) {
        await Users.create(seedUser);
      }
    }

    const danndato = await Users.findOne({ where: { username: 'danndato' } });
    if (danndato) {
      const updates = {};
      if (danndato.role !== 'SUPER-ADMIN') updates.role = 'SUPER-ADMIN';
      if (danndato.account !== 'ACTIVE') updates.account = 'ACTIVE';

      if (Object.keys(updates).length > 0) {
        await danndato.update(updates);
      }
    }

    console.log('🌱 Seeds de usuarios aplicadas correctamente.');
  };

  return Users;
};