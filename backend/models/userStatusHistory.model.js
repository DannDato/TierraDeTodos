export default (sequelize, DataTypes) => {

  const UserStatusHistory = sequelize.define('user_status_history', {

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    old_status: {
      type: DataTypes.STRING,
      defaultValue: 'LOGIN',
      allowNull: false
    },
    new_status: {
      type: DataTypes.STRING,
      defaultValue: 'FAILED',
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
  },{
    tableName: 'user_status_history',
    timestamps: false
  });

  UserStatusHistory.seed = async () => {
    const validate  = await UserStatusHistory.findAll();
    if(validate.length > 0) return;
    await UserStatusHistory.create({
        user: 10,
        old_status: 'PENDING',
        new_status: 'ACTIVE',
        reason: 'Porque es diosito',
        changed_by: 1,
        created_at: new Date().toISOString(),
    });
  };

  return UserStatusHistory;
};