// Seeder para tabla menu

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('menu', [
      {
        id: 1,
        key: 'menu.start',
        name: 'Inicio',
        icon: 'Home',
        path: '/start',
        target: '_self',
        shortAccess: true,
        orderIndex: 1,
        menu_group: 'user',
        required_permissions: '["menu.start"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 8,
        key: 'menu.news',
        name: 'Noticias',
        icon: 'Newspaper',
        path: '/news',
        target: '_self',
        shortAccess: true,
        orderIndex: 2,
        menu_group: 'user',
        required_permissions: '["menu.news"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 7,
        key: 'menu.players',
        name: 'Jugadores',
        icon: 'Gamepad2',
        path: '/players',
        target: '_self',
        shortAccess: true,
        orderIndex: 3,
        menu_group: 'user',
        required_permissions: '["menu.players"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 2,
        key: 'menu.tickets',
        name: 'Tickets',
        icon: 'ClipboardList',
        path: '/tickets',
        target: '_self',
        shortAccess: true,
        orderIndex: 4,
        menu_group: 'user',
        required_permissions: '["menu.tickets"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 4,
        key: 'menu.reports',
        name: 'Reports',
        icon: 'Flag',
        path: '/reports',
        target: '_self',
        shortAccess: false,
        orderIndex: 5,
        menu_group: 'admin',
        required_permissions: '["menu.reports"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 5,
        key: 'menu.profile',
        name: 'Cuenta',
        icon: 'User',
        path: '/profile',
        target: '_self',
        shortAccess: false,
        orderIndex: 6,
        menu_group: 'user',
        required_permissions: '["menu.profile"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 6,
        key: 'menu.community',
        name: 'Comunidad',
        icon: 'Users',
        path: '/community',
        target: '_self',
        shortAccess: true,
        orderIndex: 7,
        menu_group: 'user',
        required_permissions: '["menu.community"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 3,
        key: 'menu.users',
        name: 'Usuarios',
        icon: 'Users',
        path: '/users',
        target: '_self',
        shortAccess: false,
        orderIndex: 8,
        menu_group: 'admin',
        required_permissions: '["menu.userscontrol"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 10,
        key: 'menu.aboutapp',
        name: 'Acerca de',
        icon: 'Info',
        path: '/',
        target: '_self',
        shortAccess: false,
        orderIndex: 9,
        menu_group: 'user',
        required_permissions: '[]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      },
      {
        id: 11,
        key: 'menu.gestion',
        name: 'Gestión',
        icon: 'MonitorCog',
        path: '/gestion',
        target: '_self',
        shortAccess: false,
        orderIndex: 10,
        menu_group: 'admin',
        required_permissions: '["menu.gestion"]',
        active: true,
        createdAt: new Date('2026-04-23T18:40:56'),
        updatedAt: new Date('2026-04-27T17:40:02')
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('menu', null, {});
  }
};
