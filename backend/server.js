// iniciando proyecto TDT 3
import express from 'express'
import cors from 'cors'
// importando rutas del proyecto
import homeRoutes from './routes/homeRoutes.js' 
import authRoutes from './routes/authRoutes.js'
import { db, loadModels, models } from './models/loader.js'

// Crear la app 
const app = express()

// res.locals hace que la variable esté disponible en TODAS las vistas automáticamente
app.use((req, res, next) => {
    res.locals.folder = process.env.FOLDER || ''; // por si folder hace de las suyas como en ammfen
    next();
});

// conexion a la bd 
try {
    await loadModels();
    await db.authenticate();
    if (process.env.NODE_ENV === 'development') {
        // en desarrollo, sincronizar forzadamente para reflejar cambios en modelos
        await db.sync({ force: true });
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
    console.log('Conexion correcta a la base de datos');
} catch (error) {
    console.log(error);
}

// carpeta publica
app.use( express.static('public'))

// CORS
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Habilitar lectura de datos de formulario
app.use(express.urlencoded({extended: true}))
app.use(express.json());

// Routing
app.use(`${process.env.FOLDER || ''}/`, homeRoutes)
app.use(`${process.env.FOLDER || ''}/auth`, authRoutes)


// Definir como se ha iniciado el proeycto
console.log(`Servidor iniciado en ${process.env.NODE_ENV}`);

const port = process.env.PORT || 3000;

app.listen(port, ()=> {
    console.log(`El servidor esta funcionando en ${process.env.BACKEND_URL}:${port}/`);
});