export default (sequelize, DataTypes) => {
  const commands = sequelize.define('commands', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    command: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      defaultValue: ''
    },
    permissions: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'commands',
    timestamps: true,
    indexes: [
      {
        name: 'commands_command_unique',
        unique: true,
        fields: ['command']
      },
      {
        name: 'commands_active_idx',
        fields: ['active']
      }
    ]
  });

  commands.seed = async () => {
    const seedCommands = [
      {
        command: '/warp noticias',
        description: 'Teletransporta al hub de noticias del servidor.',
        details: 'Envialo en el chat para moverte al punto oficial de noticias. Si tienes una tarea de revisión o moderación, úsalo para llegar rápido al tablón principal y al área de anuncios activos.',
        permissions: JSON.stringify(['menu.news']),
        active: true
      },
      {
        command: '/players top',
        description: 'Muestra la lista de jugadores destacados de la edición activa.',
        details: 'Muestra ranking rápido de jugadores con mejor progreso en la edición activa. Es útil para revisar actividad general del servidor y detectar cuentas nuevas que crecieron rápido.',
        permissions: JSON.stringify(['menu.players']),
        active: true
      },
      {
        command: '/ticket abrir',
        description: 'Abre un ticket rápido para soporte dentro del juego.',
        details: 'Abre un flujo guiado para reportar problemas técnicos o de jugabilidad. Completa asunto, tipo y evidencia para que el equipo de soporte pueda responder con contexto suficiente.',
        permissions: JSON.stringify(['menu.tickets']),
        active: true
      },
      {
        command: '/comunidad gestionar',
        description: 'Activa utilidades de administración de comunidad.',
        details: 'Habilita accesos de gestión para líderes de comunidad: revisión de solicitudes, control de miembros y ajustes operativos de su grupo dentro de la edición actual.',
        permissions: JSON.stringify(['community.manage']),
        active: true
      },
      {
        command: '/news publicar',
        description: 'Publica una noticia interna desde comandos administrativos.',
        details: 'Publica una noticia con formato corto desde el juego. Este comando permite operar en modo OR de permisos: basta con contar con news.create o menu.news para verlo disponible.',
        permissions: JSON.stringify(['news.create', 'menu.news']),
        active: true
      }
    ];

    for (const seedCommand of seedCommands) {
      const row = await commands.findOne({ where: { command: seedCommand.command } });
      if (!row) {
        await commands.create(seedCommand);
      } else {
        await row.update({
          description: seedCommand.description,
          details: seedCommand.details,
          permissions: seedCommand.permissions,
          active: seedCommand.active,
        });
      }
    }
  };

  return commands;
};
