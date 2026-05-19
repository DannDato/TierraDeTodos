// iniciando proyecto TDT 3
import express from 'express'
import cors from 'cors'
// importando rutas del proyecto
import routes from './routes/index.js'
import { initializeDatabase } from './config/databaseBootstrap.js'
import { logAction } from "./helpers/logger.js";
import injectLogAction from "./middlewares/injectLogAction.js";
import secureDelay from "./middlewares/secureDelay.js";
import { startAttemptsCleanupJob } from './helpers/attemptsCleanup.js';
import { db } from './models/index.js';

// Crear la app
const app = express()

// res.locals hace que la variable esté disponible en TODAS las vistas automáticamente
app.use((req, res, next) => {
    res.locals.folder = process.env.FOLDER || ''; // por si folder hace de las suyas como en ammfen
    next();
});

// conexion a la bd
let dbConnection = false;
let dbMessage='';
const dbInit = await initializeDatabase();
dbConnection = dbInit.dbConnection;
dbMessage = dbInit.dbMessage;

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
app.use(process.env.FOLDER || '', routes)

// Definir como se ha iniciado el proeycto

const port = process.env.PORT || 3000;

// Sincronizar modelos (alter true para migraciones automáticas)
try {
  await db.sync({ alter: true });
  console.log('[DB] Modelos sincronizados con alter:true');
} catch (err) {
  console.error('[DB] Error al sincronizar modelos:', err);
}

app.listen(port, ()=> {
    console.clear();
    console.log("\n\n____________________________________________________________________\n");
    let type= !dbConnection ? 'error' : 'info';
    logAction({accion: dbMessage,apartado: 'Server',query: 'N/A',tabla: 'N/A',condicion: 'N/A',valor: 'N/A',type: type});
    logAction({accion: `Servidor iniciado en ${process.env.NODE_ENV}`,apartado: 'Server',query: 'N/A',tabla: 'N/A',condicion: 'N/A',valor: 'N/A',type: type});
    logAction({accion: `El servidor esta funcionando en ${process.env.BACKEND_URL}:${port}/`,apartado: 'Server',query: 'N/A',tabla: 'N/A',condicion: 'N/A',valor: 'N/A',type: type});

    if (dbConnection) {
        startAttemptsCleanupJob({
            onInfo: (message) => logAction({
                accion: message,
                apartado: 'AttemptsCleanup',
                query: 'N/A',
                tabla: 'Attempts',
                condicion: 'N/A',
                valor: 'N/A',
                type: 'info'
            }),
            onError: (message) => logAction({
                accion: message,
                apartado: 'AttemptsCleanup',
                query: 'N/A',
                tabla: 'Attempts',
                condicion: 'N/A',
                valor: 'N/A',
                type: 'error'
            })
        });
    }
});
