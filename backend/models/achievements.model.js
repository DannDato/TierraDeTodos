export default (sequelize, DataTypes) => {
  const Achievements = sequelize.define('Achievements', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    hint: { type: DataTypes.STRING(255), allowNull: true },
    type: { type: DataTypes.ENUM('STAT', 'CUSTOM'), allowNull: false, defaultValue: 'STAT' },
    rarity: { type: DataTypes.ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'), allowNull: false, defaultValue: 'COMMON' },
    goal: { type: DataTypes.DECIMAL(20, 0), allowNull: false, defaultValue: 1 },
    operator: { type: DataTypes.ENUM('GTE', 'LTE', 'EQ'), allowNull: true },
    statDefinitionId: { type: DataTypes.INTEGER, allowNull: true },
    isSecret: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isRepeatable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    icon: { type: DataTypes.STRING(500), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    prizeEmblemId: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'achievements',
    timestamps: true,
    indexes: [
      { name: 'achievements_active_order_idx', fields: ['isActive', 'sortOrder'] },
      { name: 'achievements_stat_idx', fields: ['statDefinitionId'] },
    ],
  });

  Achievements.associate = (models) => {
    Achievements.belongsTo(models.StatDefinitions, { foreignKey: 'statDefinitionId', as: 'statDefinition', constraints: false });
    Achievements.belongsTo(models.emblems, { foreignKey: 'prizeEmblemId', as: 'prizeEmblem', constraints: false });
    Achievements.hasMany(models.UserAchievements, { foreignKey: 'achievementId', as: 'userAchievements', constraints: false });
  };

  Achievements.seed = async () => {
    const connectedAccounts = await sequelize.models.StatDefinitions.findOne({ where: { key: 'CONNECTED_ACCOUNTS' } });
    const loginCount = await sequelize.models.StatDefinitions.findOne({ where: { key: 'LOGIN_COUNT' } });
    if (!connectedAccounts || !loginCount) return;
    const achievements = [
      { key: 'CONNECT_3_ACCOUNTS', name: 'Conexiones múltiples', description: 'Conecta tres proveedores externos a tu cuenta.', hint: 'Revisa la sección de cuentas conectadas.', type: 'STAT', rarity: 'RARE', goal: 3, operator: 'GTE', statDefinitionId: connectedAccounts.id, points: 30, sortOrder: 10 },
      { key: 'FIRST_LOGIN', name: 'Primer acceso', description: 'Completa tu primer inicio de sesión.', hint: null, type: 'STAT', rarity: 'COMMON', goal: 1, operator: 'GTE', statDefinitionId: loginCount.id, points: 5, sortOrder: 20 },
    ];
    for (const achievement of achievements) await Achievements.findOrCreate({ where: { key: achievement.key }, defaults: { ...achievement, isActive: true, isSecret: false, isRepeatable: false } });
  };

  return Achievements;
};
