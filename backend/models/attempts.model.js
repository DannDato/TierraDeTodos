export default (sequelize, DataTypes) => {

  const Attempts = sequelize.define('Attempts', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    action_type: {
      type: DataTypes.STRING,
      defaultValue: 'LOGIN',
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'FAILED',
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },{
    tableName: 'Attempts',
    timestamps: true
  });

  return Attempts;
};