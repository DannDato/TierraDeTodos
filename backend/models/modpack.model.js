module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Modpacks', {
    version: {
      type: DataTypes.STRING,
      unique: true
    },
    manifestJson: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isActive: {
      type: DataTypes.ENUM('ACTIVE','PENDING','INACTIVE'),
      defaultValue: 'PENDING'
    },
    isStable: {
      type: DataTypes.ENUM('STABLE','UNSTABLE','UNRELEASED'),
      defaultValue: 'UNRELEASED'
    }
  },{
    tableName: 'Modpacks',
    timestamps: true 
});
};