const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Configure PostgreSQL connection with explicit credentials
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',      // Default to 'postgres' if not specified
  password: process.env.DB_PASSWORD || 'postgres', // Default password
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chainelect',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } 
});

module.exports = pool;