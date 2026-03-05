// iniciando proyecto TDT 3
import express from 'express'
import cors from 'cors'
// importando rutas del proyecto
import homeRoutes from './routes/homeRoutes.js' 
import authRoutes from './routes/authRoutes.js'
import { db, loadModels, models } from './models/index.js'
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
let messageDb=''
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


// Definir como se ha iniciado el proeycto

const port = process.env.PORT || 3000;

app.listen(port, ()=> {
    console.clear();
    console.log(messageDb);
    console.log(`Servidor iniciado en ${process.env.NODE_ENV}`);
    console.log(`El servidor esta funcionando en ${process.env.BACKEND_URL}:${port}/`);
});