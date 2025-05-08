// server.js
require('dotenv').config();

const app = require("./app");
const http = require("http");
const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');
const { SUCCESS_MESSAGES } = require("./src/utilities/messages/successMessages");

const PORT = process.env.PORT || 5001;

// Function to check database connection
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Function to run migrations
async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'src/migrations');
    const sqlFile = path.join(migrationsDir, 'core_schema.sql');
    
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf-8');
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        try {
          await pool.query(statement);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists')) {
            throw err;
          }
        }
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Create an HTTP server and start listening
async function startServer() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('Could not connect to database. Please check your configuration.');
      process.exit(1);
    }
    
    // Run migrations
    await runMigrations();
    
    // Start the server
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(SUCCESS_MESSAGES.COMMON.SERVER_RUNNING(PORT));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();