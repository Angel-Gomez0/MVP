const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');

dotenv.config();

const db = new sqlite3.Database(process.env.DB_FILE, (err) => {
  if (err) {
    console.error('Error al conectar a SQLite:', err.message);
  } else {
    console.log('Conectado a SQLite');
  }
});

module.exports = db;
