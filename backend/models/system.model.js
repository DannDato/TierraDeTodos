export default (sequelize, DataTypes) => {
  const System = sequelize.define('system', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'general'
    },
    valueType: {
      type: DataTypes.ENUM('json', 'string', 'number', 'boolean', 'array'),
      allowNull: false,
      defaultValue: 'json',
      field: 'value_type'
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private'),
      allowNull: false,
      defaultValue: 'private'
    },
    editable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'system_settings',
    timestamps: true,
    indexes: [
      {
        name: 'system_settings_key_unique',
        unique: true,
        fields: ['key']
      },
      {
        name: 'system_settings_category_index',
        fields: ['category']
      },
      {
        name: 'system_settings_visibility_index',
        fields: ['visibility']
      }
    ]
  });

  System.seed = async () => {
    const seedRows = [
      {
        key: 'links.social',
        name: 'Links Sociales',
        description: 'Enlaces globales de redes y canales oficiales.',
        category: 'links',
        valueType: 'json',
        value: {
          website: '',
          youtube: '',
          discord: '',
          instagram: '',
          x: '',
          twitch: ''
        },
        visibility: 'public',
        editable: true,
        active: true
      },
      {
        key: 'features.auth',
        name: 'Control de autenticacion',
        description: 'Permite habilitar/deshabilitar login y registro.',
        category: 'features',
        valueType: 'json',
        value: {
          loginEnabled: true,
          registerEnabled: true
        },
        visibility: 'private',
        editable: true,
        active: true
      }
    ];

    for (const row of seedRows) {
      const existing = await System.findOne({ where: { key: row.key } });
      if (!existing) {
        await System.create(row);
      }
    }
  };

  return System;
};

