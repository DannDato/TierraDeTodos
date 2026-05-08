import { User } from "cloudflare/resources/index.mjs";

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
    source: {
      type: DataTypes.ENUM('REGISTER', 'LOGIN'),
      allowNull: false,
      defaultValue: 'REGISTER'
    }
  },{
    tableName: 'user_editions',
    timestamps: true,
    indexes: [
        {
        name: 'user_editions_id_unique',
            unique: true,
            fields: ['id'],
        },
        {
        name: 'user_editions_editionId_index',
            unique: false,
            fields: ['editionId'],
        },
        {
        name: 'user_editions_userID_index',
            unique: false,
            fields: ['userID'],
        },
        {
        name: 'user_editions_edition_user_unique',
            unique: true,
            fields: ['editionId', 'userID'],
        }
    ]
  });

  UserEdition.associate = (models) => {
    UserEdition.belongsTo(models.Edition, {
      foreignKey: 'editionId',
      as: 'edition',
      constraints: false
    });

    UserEdition.belongsTo(models.Users, {
      foreignKey: 'userID',
      as: 'user',
      constraints: false
    });
  };

  UserEdition.seed = async () => {
    const existing = await UserEdition.findOne();
    if (existing) return;
    await UserEdition.bulkCreate([
        { editionId: 3, userID: 2, source: 'REGISTER' },
        { editionId: 3, userID: 3, source: 'REGISTER' },
        { editionId: 3, userID: 4, source: 'REGISTER' },
        { editionId: 3, userID: 5, source: 'REGISTER' },
        { editionId: 3, userID: 1, source: 'REGISTER' },
        { editionId: 3, userID: 6, source: 'REGISTER' }
      ]);
  };


  return UserEdition;
};
