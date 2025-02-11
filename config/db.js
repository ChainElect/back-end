/**
 * @module db
 * @description Sets up and exports a PostgreSQL connection pool using the 'pg' module.
 * The connection string is read from the environment variable DATABASE_URL.
 * Ensure that DATABASE_URL is set in your environment or .env file.
 */

const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
