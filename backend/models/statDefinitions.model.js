export default (sequelize, DataTypes) => {
  const StatDefinitions = sequelize.define('StatDefinitions', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    dataType: { type: DataTypes.ENUM('NUMBER', 'BOOLEAN'), allowNull: false, defaultValue: 'NUMBER' },
    aggregation: { type: DataTypes.ENUM('INCREMENT', 'SET'), allowNull: false, defaultValue: 'INCREMENT' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'stat_definitions',
    timestamps: true,
    indexes: [{ name: 'stat_definitions_active_idx', fields: ['isActive'] }],
  });

  StatDefinitions.associate = (models) => {
    StatDefinitions.hasMany(models.UserStats, { foreignKey: 'statDefinitionId', as: 'userStats', constraints: false });
    StatDefinitions.hasMany(models.Achievements, { foreignKey: 'statDefinitionId', as: 'achievements', constraints: false });
  };

  StatDefinitions.seed = async () => {
    const stats = [
      { key: 'CONNECTED_ACCOUNTS', name: 'Cuentas conectadas', description: 'Proveedores externos conectados a la cuenta.', aggregation: 'SET' },
      { key: 'EMBLEMS_ACHIEVED', name: 'Emblemas obtenidos', description: 'Cantidad de emblemas únicos obtenidos.', aggregation: 'SET' },
      { key: 'LOGIN_COUNT', name: 'Inicios de sesión', description: 'Cantidad de inicios de sesión completados.', aggregation: 'INCREMENT' },
      { key: 'REPORTS_RECEIVED', name: 'Reportes recibidos', description: 'Reportes recibidos por el usuario.', aggregation: 'INCREMENT' },
      { key: 'BANS_RECEIVED', name: 'Bans recibidos', description: 'Bans recibidos por el usuario.', aggregation: 'INCREMENT' },
    ];
    for (const stat of stats) await StatDefinitions.findOrCreate({ where: { key: stat.key }, defaults: { ...stat, dataType: 'NUMBER', isActive: true } });
  };

  return StatDefinitions;
};
