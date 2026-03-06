// iniciando proyecto TDT 3
import express from 'express'
import cors from 'cors'
// importando rutas del proyecto
import homeRoutes from './routes/homeRoutes.js' 
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { db, loadModels, models } from './models/index.js'
import injectLogAction from "./middlewares/injectLogAction.js";
import secureDelay from "./middlewares/secureDelay.js";
import { QueryTypes } from 'sequelize';

// Crear la app 
const app = express()

// res.locals hace que la variable esté disponible en TODAS las vistas automáticamente
app.use((req, res, next) => {
    res.locals.folder = process.env.FOLDER || ''; // por si folder hace de las suyas como en ammfen
    next();
});

// conexion a la bd 
let messageDb=''
try {
    await loadModels();
    await db.authenticate();

    const tableExists = async (tableName) => {
        const [result] = await db.query(
            `
                SELECT COUNT(*) AS count
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                AND table_name = :tableName
            `,
            {
                replacements: { tableName },
                type: QueryTypes.SELECT
            }
        );

        return Number(result?.count || 0) > 0;
    };

    const columnExists = async (tableName, columnName) => {
        const [result] = await db.query(
            `
                SELECT COUNT(*) AS count
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                AND table_name = :tableName
                AND column_name = :columnName
            `,
            {
                replacements: { tableName, columnName },
                type: QueryTypes.SELECT
            }
        );

        return Number(result?.count || 0) > 0;
    };

    const migrateLegacySchemaToPermissions = async () => {
        const hasLegacyPermissionsCatalogTable = await tableExists('Scopes');
        const hasPermissionsTable = await tableExists('Permissions');
        if (hasLegacyPermissionsCatalogTable && !hasPermissionsTable) {
            await db.query('RENAME TABLE Scopes TO Permissions');
        }

        const hasLegacyUserPermissionsTable = await tableExists('UserScopes');
        const hasUserPermissionsTable = await tableExists('UserPermissions');
        if (hasLegacyUserPermissionsTable && !hasUserPermissionsTable) {
            await db.query('RENAME TABLE UserScopes TO UserPermissions');
        }

        const hasLegacyPresetPermissionsTable = await tableExists('PresetScopes');
        const hasPresetPermissionsTable = await tableExists('PresetPermissions');
        if (hasLegacyPresetPermissionsTable && !hasPresetPermissionsTable) {
            await db.query('RENAME TABLE PresetScopes TO PresetPermissions');
        }

        if (await tableExists('Menu')) {
            const hasLegacyRequiredPermissionsColumn = await columnExists('Menu', 'required_scopes');
            const hasRequiredPermissions = await columnExists('Menu', 'required_permissions');
            if (hasLegacyRequiredPermissionsColumn && !hasRequiredPermissions) {
                await db.query('ALTER TABLE Menu CHANGE COLUMN required_scopes required_permissions JSON NOT NULL');
            }
        }

        if (await tableExists('UserPermissions')) {
            const hasLegacyPermissionRefColumn = await columnExists('UserPermissions', 'scopeId');
            const hasPermissionId = await columnExists('UserPermissions', 'permissionId');
            if (hasLegacyPermissionRefColumn && !hasPermissionId) {
                await db.query('ALTER TABLE UserPermissions CHANGE COLUMN scopeId permissionId INT NOT NULL');
            }
        }

        if (await tableExists('PresetPermissions')) {
            const hasLegacyPermissionKeyColumn = await columnExists('PresetPermissions', 'scopeKey');
            const hasPermissionKey = await columnExists('PresetPermissions', 'permissionKey');
            if (hasLegacyPermissionKeyColumn && !hasPermissionKey) {
                await db.query('ALTER TABLE PresetPermissions CHANGE COLUMN scopeKey permissionKey VARCHAR(255) NOT NULL');
            }
        }
    };

    await migrateLegacySchemaToPermissions();

    if (process.env.NODE_ENV === 'development') {
        await db.sync();
        // await db.sync({ force: true });
        // await db.sync({ alter: true });
    } else {
        // en producción, sincronizar sin perder datos
        // await db.sync({ alter: true });
        await db.sync();
    }

    // ejecutar seeds automaticamente si existen
    for (const modelName of Object.keys(models)) {
        const model = models[modelName];
        if (typeof model.seed === 'function') {
            await model.seed();
        }
    }

    // limpiar permisos históricos de gestión de usuarios para no-admin
    await db.query(
        `
            DELETE up
            FROM UserPermissions up
            INNER JOIN Users u ON u.id = up.userId
            INNER JOIN Permissions p ON p.id = up.permissionId
            WHERE u.rol <> 'ADMIN'
            AND p.key IN ('menu.users', 'menu.userscontrol')
        `,
        { type: QueryTypes.DELETE }
    );

    // alinear presets históricos para que solo ADMIN conserve permisos de gestión
    await models.PresetPermissions.destroy({
        where: {
            permissionKey: ['menu.users', 'menu.userscontrol'],
            role: ['MOD', 'POLICE', 'STREAMER', 'USER']
        }
    });

    messageDb = 'Conexión a la base de datos exitosa';
} catch (error) {
    messageDb = 'Error al conectar a la base de datos'+error.message;
}

// carpeta publica
app.use( express.static('public'))

// CORS
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// mis injections
app.use(injectLogAction);
app.use(secureDelay);

// Habilitar lectura de datos de formulario
app.use(express.urlencoded({extended: true}))
app.use(express.json());

// Routing
app.use(`${process.env.FOLDER || ''}/`, homeRoutes)
app.use(`${process.env.FOLDER || ''}/auth`, authRoutes)
app.use(`${process.env.FOLDER || ''}/user`, userRoutes)


// Definir como se ha iniciado el proeycto

const port = process.env.PORT || 3000;

app.listen(port, ()=> {
    console.clear();
    console.log(messageDb);
    console.log(`Servidor iniciado en ${process.env.NODE_ENV}`);
    console.log(`El servidor esta funcionando en ${process.env.BACKEND_URL}:${port}/`);
});