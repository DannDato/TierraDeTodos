// iniciando proyecto TDT 3
import express from 'express'
import cors from 'cors'
// importando rutas del proyecto
import homeRoutes from './routes/homeRoutes.js' 
import authRoutes from './routes/authRoutes.js'
import db from './config/database.js'

// Crear la app 
const app = express()

// res.locals hace que la variable esté disponible en TODAS las vistas automáticamente
app.use((req, res, next) => {
    res.locals.folder = process.env.FOLDER || ''; // por si folder hace de las suyas como en ammfen
    next();
});

// conexion a la bd 
try{
    await db.authenticate();
    if(process.env.NODE_ENV === 'development'){
        await db.sync({ force: true, alter: true });
    }else{
        await db.sync({ alter: true });
    }
    console.log('Conexion correcta a la base de datos');
} catch(error){
    console.log(error);
}

// carpeta publica
app.use( express.static('public'))

// CORS
console.log("CORS origin:", `${process.env.FRONTEND_BASE}:${process.env.FRONTEND_PORT}`);
// app.use(cors({
//     origin: `${process.env.FRONTEND_BASE}:${process.env.FRONTEND_PORT}`,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH",],
//     allowedHeaders: ["Content-Type", "Authorization"],
// }))
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Habilitar lectura de datos de formulario
app.use(express.urlencoded({extended: true}))
app.use(express.json());

// Reuting
app.use(`${process.env.FOLDER || ''}/`, homeRoutes)
app.use(`${process.env.FOLDER || ''}/auth`, authRoutes)


// Definir como se ha iniciado el proeycto
console.log(`Servidor iniciado en ${process.env.NODE_ENV}`);

const port = process.env.PORT || 3000;

app.listen(port, ()=> {
    console.log(`El servidor esta funcionando en ${process.env.BACKEND_URL}:${port}/`);
});