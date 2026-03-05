
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({path: '.env'})

const db = new Sequelize(process.env.db_name,  process.env.db_user, process.env.db_pass ?? '', {
    host: process.env.db_host,
    port: process.env.db_port,
    dialect: 'mysql',
    define: {
        timestamps: true
    },
    pool: {
        max:  5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    operatorAliases: false,
    logging: false
});


export default db;