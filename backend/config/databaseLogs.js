import { Sequelize } from "sequelize";

const dbLogs = new Sequelize(
  process.env.DB_LOGS,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false
  }
);

export default dbLogs;