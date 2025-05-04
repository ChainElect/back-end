// Then load environment variables
require('dotenv').config();

const app = require("./app");
const http = require("http");
const pool = require('./src/config/db');
const MigrationRunner = require('./src/migrations/migrationRunner');
const {
  SUCCESS_MESSAGES,
} = require("./src/utilities/messages/successMessages");

const PORT = process.env.PORT || 5001;

// Function to check database connection
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT datetime("now")');
    console.log('Database connection established');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Function to run migrations
async function runMigrations() {
  const migrationRunner = new MigrationRunner(pool);
  await migrationRunner.runAllMigrations();
}

// Create an HTTP server and start listening
async function startServer() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.log('Creating new database...');
      // SQLite will create the database file automatically
    }
    
    // Run migrations
    console.log('Running database migrations...');
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