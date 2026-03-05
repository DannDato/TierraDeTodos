import dbLogs from '../config/databaseLogs.js';
import { QueryTypes } from 'sequelize';
import logger from './winston.js';
import { use } from 'react';


let currentLogTable = null;

async function ensureLogTable(fecha) {

  const year = fecha.getFullYear();
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const logTable = `Logs_${year}_${month}`;

  // si ya es la misma tabla del mes, no hacer nada
  if (currentLogTable === logTable) {
    return logTable;
  }

  const tables = await dbLogs.query(
    `SHOW TABLES LIKE :table`,
    {
      replacements: { table: logTable },
      type: QueryTypes.SELECT
    }
  );

  if (tables.length === 0) {

    await dbLogs.query(`
      CREATE TABLE ${logTable} (
        id INT NOT NULL AUTO_INCREMENT,
        usuario INT NULL,
        username VARCHAR(100) NULL,
        ip VARCHAR(50) NULL,
        device VARCHAR(255) NULL,
        fecha DATETIME NULL,
        accion VARCHAR(255) NULL,
        apartado VARCHAR(255) NULL,
        tabla VARCHAR(255) NULL,
        query ENUM('select','insert','update','delete','click') NULL,
        condicion MEDIUMTEXT NULL,
        valor VARCHAR(255) NULL,
        old_data LONGTEXT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    logger.info({ message: `Tabla de logs creada: ${logTable}`, username: 'System' });
  }

  currentLogTable = logTable;

  return logTable;
}

export async function logAction({
  accion,
  apartado,
  query = '',
  tabla = '',
  condicion = '',
  valor = '',
  userId = null,
  username = '',
  ip = '',
  fecha = new Date(),
  device = null,
  type = 'info'
}) {

  try {

    const logTable = await ensureLogTable(fecha);

    let oldData = null;

    if (tabla && condicion && ["update", "delete"].includes(query?.toLowerCase())) {

      const rows = await dbLogs.query(
        `SELECT * FROM ${tabla} WHERE ${condicion}`,
        { type: QueryTypes.SELECT }
      );

      oldData = JSON.stringify(rows);
    }

    await dbLogs.query(
      `
      INSERT INTO ${logTable}
      (usuario, username, ip, device, fecha, accion, apartado, tabla, query, condicion, valor, old_data)
      VALUES (:usuario, :username, :ip, :device, :fecha, :accion, :apartado, :tabla, :query, :condicion, :valor, :old_data)
      `,
      {
        replacements: {
          usuario: userId,
          username,
          ip,
          device,
          fecha,
          accion,
          apartado,
          tabla,
          query,
          condicion,
          valor,
          old_data: oldData
        }
      }
    );

    if (type === 'error') {
      logger.error({
        level: type,
        message: `${accion}`,
        username,
        ip
      });
    }else{
      logger.log({
        level: type,
        message: `${accion}`,
        username,
        ip
      });
    }

  } catch (error) {

    logger.error(`Error guardando log: ${error.message}`);

  }

}