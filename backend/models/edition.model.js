export default (sequelize, DataTypes) => {

    const Edition = sequelize.define('Edition', {
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        color:{
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '#000000'
        },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            allowNull: false,
            defaultValue: 'ACTIVE'
        },
        date_start: {
            type: DataTypes.DATE,
            allowNull: false
        },
        date_end: {
            type: DataTypes.DATE,
            allowNull: true
        },
        description:{
            type: DataTypes.TEXT,
            allowNull: true
        }
        },{
        tableName: 'edition',
        timestamps: false,
        indexes: [
            {
                name: 'edition_id_unique',
                unique: true,
                fields: ['id'],
            },
            {
                name: 'edition_number_unique',
                unique: true,
                fields: ['number'],
            },
            {
                name: 'edition_status_index',
                fields: ['status'],
            }
        ]
    });

    Edition.associate = (models) => {
    Edition.hasMany(models.UserEdition, {
        foreignKey: 'editionId',
        as: 'userEditions'
    });

    Edition.belongsToMany(models.Users, {
        through: models.UserEdition,
        foreignKey: 'editionId',
        otherKey: 'userID',
        as: 'users'
    });
    };

    Edition.seed = async () => {
        const seedEditions = [
            { id:1, name: 'Tierra de Todos 1', number: '1', date_start: new Date('2024-08-01'), date_end: new Date('2024-12-31'), description: 'Primera edición de tierra de todos, funcionó como edición beta donde se encontraron muchos errores y se realizaron pruebas iniciales', status: 'INACTIVE' },
            { id:2, name: 'Tierra de Todos 2', number: '2', date_start: new Date('2025-01-24'), date_end: new Date('2026-04-12'), description: 'Segunda edición de tierra de todos, con mejoras y correcciones basadas en la primera edición y un éxito en invitados y eventos', status: 'INACTIVE' },
            { id:3, name: 'Tierra de Todos 3', number: '3', date_start: new Date('2026-01-11'), date_end: null, description: 'Tercera edición de tierra de todos, con nuevas características y mejoras significativas', status: 'ACTIVE' },
        ];

        for (const seedEdition of seedEditions) {
          const existingEdition = await Edition.findOne({ where: { id: seedEdition.id } });
          if (!existingEdition) {
            await Edition.create(seedEdition);
          }
        }
    }


    return Edition;
};