// iniciando proyecto TDT 3
import express from 'express'
import sequelize from './config/database.js'
// importando rutas del proyecto
import homeRoutes from './routes/homeRoutes.js' 
import authRoutes from './routes/authRoutes.js'

// Crear la app 
const app = express()

// Habilitar lectura de datos de formulario
app.use(express.urlencoded({extended: true}))
app.use(express.json());


// res.locals hace que la variable esté disponible en TODAS las vistas automáticamente
app.use((req, res, next) => {
    res.locals.folder = process.env.FOLDER || ''; // por si folder hace de las suyas como en ammfen
    next();
});

// conexion a la bd 
try{
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Conexion correcta a la base de datos');
} catch(error){
    console.log(error);
}

// carpeta publica
app.use( express.static('public'))

// Reuting
app.use(`${process.env.FOLDER || ''}/`, homeRoutes)
app.use(`${process.env.FOLDER || ''}/auth`, authRoutes)

// Definir como se ha iniciado el proeycto
console.log(`Servidor iniciado en ${process.env.NODE_ENV}`);

const port = process.env.PORT || 3000;

app.listen(port, ()=> {
    console.log(`El servidor esta funcionando en ${process.env.BACKEND_URL}:${port}/`);
});