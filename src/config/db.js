const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const isLocal = connectionString && connectionString.includes('localhost');

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = pool;
