import { db, loadModels, models } from '../models/index.js';
import { FK_DEFINITIONS, SEED_ORDER } from './databaseBootstrapConfig.js';

async function ensureForeignKeyConstraints() {
    const qi = db.getQueryInterface();
    const dbName = db.config?.database || db.options?.database;

    const fkExists = async (constraintName, tableName) => {
        const [rows] = await db.query(
            `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = :db
               AND CONSTRAINT_NAME = :name
               AND TABLE_NAME = :table
               AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             LIMIT 1`,
            { replacements: { db: dbName, name: constraintName, table: tableName } }
        );
        return rows.length > 0;
    };

    const addFK = async (constraintName, table, fields, referencedTable, referencedFields, opts = {}) => {
        try {
            if (await fkExists(constraintName, table)) return;
            await qi.addConstraint(table, {
                name: constraintName,
                type: 'FOREIGN KEY',
                fields,
                references: { table: referencedTable, field: referencedFields[0] },
                onUpdate: opts.onUpdate || 'CASCADE',
                onDelete: opts.onDelete || 'SET NULL',
            });
            console.log(`[fk] Creado: ${constraintName}`);
        } catch (err) {
            console.warn(`[fk] ${constraintName} no se pudo crear (no critico): ${err.message}`);
        }
    };

    for (const fk of FK_DEFINITIONS) {
        await addFK(
            fk.name,
            fk.table,
            fk.fields,
            fk.referencedTable,
            fk.referencedFields,
            fk.options || {}
        );
    }

    console.log('[fk] Verificacion de foreign keys completada.');
}

async function runModelSeeds() {
    const seeded = new Set();
    for (const modelName of SEED_ORDER) {
        const model = models[modelName];
        if (model && typeof model.seed === 'function') {
            await model.seed();
            seeded.add(modelName);
        }
    }

    for (const modelName of Object.keys(models)) {
        if (seeded.has(modelName)) continue;
        const model = models[modelName];
        if (typeof model.seed === 'function') {
            await model.seed();
        }
    }
}

export async function initializeDatabase() {
    let dbConnection = false;
    let dbMessage = '';

    try {
        await loadModels();
        await db.authenticate();
        // await db.sync({ alter: true });
        await db.sync();
        // await ensureForeignKeyConstraints();
        // await runModelSeeds();

        dbConnection = true;
        dbMessage = 'Base de datos conectada correctamente';
    } catch (error) {
        dbConnection = false;
        dbMessage = `Error al conectar a la base de datos: ${error.message}`;
    }

    return { dbConnection, dbMessage };
}
