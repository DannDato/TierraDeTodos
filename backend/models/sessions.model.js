export default (sequelize, DataTypes) => {

  const Sessions = sequelize.define('Sessions', {

    id:{
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId:{
      type: DataTypes.INTEGER,
      allowNull: false
    },

    jwt:{
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    ip:{
      type: DataTypes.STRING
    },

    device:{
      type: DataTypes.STRING
    },

    expiresAt:{
      type: DataTypes.DATE,
      allowNull: false
    },

    revoked:{
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  },{
    tableName: 'Sessions',
    timestamps: true,
    indexes: [
      {
        name: 'sessions_jti_unique',
        unique: true,
        fields: ['jwt']
      },
      {
        name: 'sessions_userId_index',
        fields: ['userId']
      }
    ]
  });

  Sessions.associate = (models) => {

    Sessions.belongsTo(models.Users,{
      foreignKey:'userId',
      as:'user',
      onDelete:'CASCADE'
    });

  };

  return Sessions;

};