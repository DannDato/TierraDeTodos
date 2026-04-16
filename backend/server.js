// iniciando proyecto TDT 3
import express from 'express'
import cors from 'cors'
// importando rutas del proyecto
import routes from './routes/index.js'
import { db, loadModels, models } from './models/index.js'
import { logAction } from "./helpers/logger.js";
import injectLogAction from "./middlewares/injectLogAction.js";
import secureDelay from "./middlewares/secureDelay.js";

// Crear la app
const app = express()

// res.locals hace que la variable esté disponible en TODAS las vistas automáticamente
app.use((req, res, next) => {
    res.locals.folder = process.env.FOLDER || ''; // por si folder hace de las suyas como en ammfen
    next();
});

// conexion a la bd
let dbConnection = false;
let dbMessage=''
try {
    await loadModels();
    await db.authenticate();
    if (process.env.NODE_ENV === 'development') {
        await db.sync({ alter: true });
        // await db.sync({ force: true });
    } else {
        // en producción, sincronizar sin perder datos
        await db.sync({ alter: true });
    }

    // ejecutar seeds automaticamente si existen
    for (const modelName of Object.keys(models)) {
        const model = models[modelName];
        if (typeof model.seed === 'function') {
            await model.seed();
        }
    }
    dbConnection = true;
    dbMessage = 'Base de datos conectada correctamente';
} catch (error) {
    dbConnection = false;
    dbMessage = `Error al conectar a la base de datos: ${error.message}`;
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
app.use(process.env.FOLDER || '', routes)


// Definir como se ha iniciado el proeycto

const port = process.env.PORT || 3000;

app.listen(port, ()=> {
    console.clear();
    console.log("\n\n____________________________________________________________________\n");
    let type= !dbConnection ? 'error' : 'info';
    logAction({
        accion: dbMessage,
        apartado: 'Server',
        query: 'N/A',
        tabla: 'N/A',
        condicion: 'N/A',
        valor: 'N/A',
        type: type
    });
    logAction({
        accion: `Servidor iniciado en ${process.env.NODE_ENV}`,
        apartado: 'Server',
        query: 'N/A',
        tabla: 'N/A',
        condicion: 'N/A',
        valor: 'N/A',
        type: type
    });
    logAction({
        accion: `El servidor esta funcionando en ${process.env.BACKEND_URL}:${port}/`,
        apartado: 'Server',
        query: 'N/A',
        tabla: 'N/A',
        condicion: 'N/A',
        valor: 'N/A',
        type: type
    });


});