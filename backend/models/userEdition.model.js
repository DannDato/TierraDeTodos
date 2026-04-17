export default (sequelize, DataTypes) => {

  const UserEdition = sequelize.define('UserEdition', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    editionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },{
    tableName: 'user_edition',
    timestamps: true,
    indexes: [
        {
        name: 'user_edition_id_unique',
            unique: true,
            fields: ['id'],
        },
        {
        name: 'user_edition_editionId_unique',
            unique: false,
            fields: ['editionId'],
        },
        {
        name: 'user_edition_userID_unique',
            unique: false,
            fields: ['userID'],
        }
    ]
  });

  UserEdition.associate = (models) => {
    UserEdition.belongsTo(models.Edition, {
      foreignKey: 'editionId',
      as: 'edition'
    });

    UserEdition.belongsTo(models.Users, {
      foreignKey: 'userID',
      as: 'user'
    });
  };


  return UserEdition;
};