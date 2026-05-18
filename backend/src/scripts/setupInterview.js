require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function setupInterviewTables() {
  const schemaPath = path.join(__dirname, '../../sql/interview_schema.sql');
  const sql = await fs.promises.readFile(schemaPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('Interview tables are ready.');
  } catch (error) {
    console.error('Failed to create interview tables.');
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupInterviewTables();
