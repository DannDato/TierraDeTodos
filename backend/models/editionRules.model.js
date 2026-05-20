export default (sequelize, DataTypes) => {

    const EditionRules = sequelize.define('EditionRules', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        editionId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        category: {
            type: DataTypes.ENUM('PRINCIPAL', 'OBLIGACION', 'TECNICO', 'STAFF'),
            allowNull: false
        },
        item: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        active: {
            type: DataTypes.ENUM('YES', 'NO'),
            allowNull: false,
            defaultValue: 'YES'
        }
    }, {
        tableName: 'edition_rules',
        timestamps: false,
        indexes: [
            {
                name: 'edition_rules_id_unique',
                unique: true,
                fields: ['id'],
            },
            {
                name: 'edition_rules_edition_id_index',
                fields: ['editionId'],
            },
            {
                name: 'edition_rules_category_index',
                fields: ['category'],
            },
            {
                name: 'edition_rules_active_index',
                fields: ['active'],
            },
            {
                name: 'edition_rules_sort_order_index',
                fields: ['sortOrder'],
            },
            {
                name: 'edition_rules_unique_row',
                unique: true,
                fields: ['editionId', 'category', 'item'],
            }
        ]
    });

    EditionRules.associate = (models) => {
        EditionRules.belongsTo(models.Edition, {
            foreignKey: 'editionId',
            as: 'edition',
      constraints: false
        });
    };

    EditionRules.seed = async () => {
        const seedRules = [
            { editionId: 3, category: 'PRINCIPAL', item: 'Prohibido entrar a casas sin permiso.', color: '#f87171', sortOrder: 10 },
            { editionId: 3, category: 'PRINCIPAL', item: 'Prohibido abrir cofres ajenos.', color: '#f87171', sortOrder: 11 },
            { editionId: 3, category: 'PRINCIPAL', item: 'Prohibido robar objetos.', color: '#f87171', sortOrder: 12 },
            { editionId: 3, category: 'PRINCIPAL', item: 'Prohibido matar mascotas.', color: '#f87171', sortOrder: 13 },
            { editionId: 3, category: 'PRINCIPAL', item: 'Prohibidas construcciones flotantes.', color: '#f87171', sortOrder: 14 },
            { editionId: 3, category: 'PRINCIPAL', item: 'Prohibido usar TNT o explosivos.', color: '#f87171', sortOrder: 15 },
            { editionId: 3, category: 'PRINCIPAL', item: 'Prohibido acceder al Nether o End.', color: '#f87171', sortOrder: 16 },
            { editionId: 3, category: 'PRINCIPAL', item: 'Prohibido usar hacks o glitches.', color: '#f87171', sortOrder: 17 },
            { editionId: 3, category: 'OBLIGACION', item: 'Plantar un árbol por cada árbol talado.', color: '#4ade80', sortOrder: 20 },
            { editionId: 3, category: 'OBLIGACION', item: 'Respetar construcciones ajenas.', color: '#4ade80', sortOrder: 21 },
            { editionId: 3, category: 'OBLIGACION', item: 'Mantener convivencia respetuosa.', color: '#4ade80', sortOrder: 22 },
            { editionId: 3, category: 'OBLIGACION', item: 'Reparar daños accidentales.', color: '#4ade80', sortOrder: 23 },
            { editionId: 3, category: 'OBLIGACION', item: 'Respetar decisiones del staff.', color: '#4ade80', sortOrder: 24 },
            { editionId: 3, category: 'TECNICO', item: 'Prohibido uso de X-Ray.', color: '#facc15', sortOrder: 30 },
            { editionId: 3, category: 'TECNICO', item: 'Prohibido mods que den ventaja.', color: '#facc15', sortOrder: 31 },
            { editionId: 3, category: 'TECNICO', item: 'Prohibido macros o automatizaciones.', color: '#facc15', sortOrder: 32 },
            { editionId: 3, category: 'TECNICO', item: 'Prohibido cualquier modificación no vanilla.', color: '#facc15', sortOrder: 33 },
            { editionId: 3, category: 'STAFF', item: 'No ignorar indicaciones del streamer.', color: '#ffbb01', sortOrder: 40 },
            { editionId: 3, category: 'STAFF', item: 'Respetar la jerarquía del servidor.', color: '#ffbb01', sortOrder: 41 },
            { editionId: 3, category: 'STAFF', item: 'Comunicar conflictos al streamer correspondiente.', color: '#ffbb01', sortOrder: 42 },
            { editionId: 3, category: 'STAFF', item: 'No saltar la cadena de comunicación.', color: '#ffbb01', sortOrder: 43 }
        ];

        for (const seedRule of seedRules) {
            const existingRule = await EditionRules.findOne({
                where: {
                    editionId: seedRule.editionId,
                    category: seedRule.category,
                    item: seedRule.item,
                }
            });

            if (!existingRule) {
                await EditionRules.create({
                    ...seedRule,
                    active: 'YES'
                });
            }
        }
    };

    return EditionRules;
};
