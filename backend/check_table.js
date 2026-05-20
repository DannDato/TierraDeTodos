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
    const [results] = await connection.query('DESCRIBE edition_dates;');
    console.table(results);
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await connection.end();
  }
}

run();
