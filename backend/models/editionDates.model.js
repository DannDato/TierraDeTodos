export default (sequelize, DataTypes) => {

    const EditionDates = sequelize.define('EditionDates', {
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        editionId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date:{
            type: DataTypes.DATE,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: true
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true
        },
        active:{
            type: DataTypes.ENUM('YES', 'NO'),
            allowNull: false,
            defaultValue: 'YES'
        },
        },{
        tableName: 'edition_dates',
        timestamps: false,
        indexes: [
            {
                name: 'edition_dates_id_unique',
                unique: true,
                fields: ['id'],
            },
            {
                name: 'edition_dates_edition_id_index',
                fields: ['editionId'],
            },
            {
                name: 'edition_dates_date_index',
                fields: ['date'],
            },
            {
                name: 'edition_dates_active_index',
                fields: ['active'],
            },
            {
                name: 'edition_dates_color_index',
                fields: ['color'],
            },
            {
                name: 'edition_dates_edition_date_unique',
                unique: true,
                fields: ['editionId', 'date', 'name'],
            }
        ]
    });

    EditionDates.associate = (models) => {
    EditionDates.belongsTo(models.Edition, {
        foreignKey: 'editionId',
        as: 'edition',
      constraints: false
    });
    };

    EditionDates.seed = async () => {
        const seedEditionDates = [
            { editionId: 3, date: new Date('2026-01-24'), name: 'La Era de Piedra', description: 'Inicio del servidor...', emoji: '🪨', color: '#9ca3af', active: 'YES' },
            { editionId: 3, date: new Date('2026-01-30'), name: 'El Despertar del Metal', description: 'Cobre + Evento Parkour', emoji: '🔶', color: '#fb923c', active: 'YES' },
            { editionId: 3, date: new Date('2026-02-06'), name: 'La Forja del Acero', description: 'Hierro + Redstone', emoji: '⚒️', color: '#d1d5db', active: 'YES' },
            { editionId: 3, date: new Date('2026-02-13'), name: 'El Llamado de la Sangre', description: 'PVP + Torneo.', emoji: '🔴', color: '#dc2626', active: 'YES' },
            { editionId: 3, date: new Date('2026-02-20'), name: 'Los Secretos Arcanos', description: 'Encantamientos', emoji: '🧙‍♂️', color: '#a855f7', active: 'YES' },
            { editionId: 3, date: new Date('2026-02-27'), name: 'La Era del Comercio', description: 'Trade con aldeanos', emoji: '💰', color: '#4ade80', active: 'YES' },
            { editionId: 3, date: new Date('2026-03-06'), name: 'El Corazón del Mundo', description: 'Diamantes + Evento', emoji: '💎', color: '#38bdf8', active: 'YES' },
            { editionId: 3, date: new Date('2026-03-20'), name: 'El Fuego Ancestral', description: 'Apertura del Nether', emoji: '🔥', color: '#f97316', active: 'YES' },
            { editionId: 3, date: new Date('2026-03-27'), name: 'El Juicio Final', description: 'Evento final', emoji: '👑', color: '#facc15', active: 'YES' },
        ];

        for (const seedEditionDate of seedEditionDates) {
          const existingEditionDate = await EditionDates.findOne({
            where: {
              editionId: seedEditionDate.editionId,
              date: seedEditionDate.date,
              name: seedEditionDate.name,
            }
          });
          if (!existingEditionDate) {
            await EditionDates.create(seedEditionDate);
          }
        }
    }


    return EditionDates;
};
