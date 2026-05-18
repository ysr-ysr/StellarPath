const { Pool } = require('pg');
require('dotenv').config();

// A connection pool lets the app reuse PostgreSQL connections efficiently.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Simple startup check so beginners can quickly see if the database is reachable.
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected at:', result.rows[0].now);
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
};
