import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.db_host || 'localhost',
    user: process.env.db_user || 'root',
    password: process.env.db_pass || '',
    database: process.env.db_name || 'tdt',
    port: process.env.db_port || 3306
  });

  try {
    const [results, fields] = await connection.query('ALTER TABLE edition_dates DROP COLUMN emoji;');
    console.log('Column emoji dropped successfully from edition_dates');
    console.log(results);
  } catch (err) {
    if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('Column emoji does not exist or was already dropped.');
    } else {
        console.error('Error executing query:', err);
    }
  } finally {
    await connection.end();
  }
}

run();
