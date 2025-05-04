// src/migrations/migrationRunner.js

const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor(pool) {
    this.pool = pool;
    this.migrationsDir = path.join(__dirname);
    // adjust this to wherever your SQLite file lives
    this.dbFile = path.resolve(__dirname, '../database.sqlite');
  }

  /**
   * Convert PostgreSQL syntax to SQLite syntax
   */
  convertToSQLite(sql) {
    // SERIAL → autoincrement
    sql = sql.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  
    // VARCHAR(n) → TEXT
    sql = sql.replace(/VARCHAR\(\d+\)/gi, 'TEXT');
  
    // TIMESTAMP WITH TIME ZONE → DATETIME
    sql = sql.replace(/TIMESTAMP WITH TIME ZONE/gi, 'DATETIME');
  
    // BOOLEAN → INTEGER
    sql = sql.replace(/BOOLEAN/gi, 'INTEGER');
  
    // strip IF NOT EXISTS on ADD COLUMN
    sql = sql.replace(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/gi, 'ADD COLUMN');
  
    // Convert PostgreSQL placeholders ($1, $2, etc.) to SQLite '?'
    sql = sql.replace(/\$\d+/g, '?');
  
    // Replace DEFAULT now() with SQLite equivalent
    sql = sql.replace(/DEFAULT\s+now\(\)/gi, "DEFAULT (datetime('now'))");
    // Catch any other now() calls (e.g. in expressions)
    sql = sql.replace(/\bnow\(\)/gi, "datetime('now')");
  
    // Replace DEFAULT CURRENT_TIMESTAMP as well
    sql = sql.replace(/DEFAULT\s+CURRENT_TIMESTAMP/gi, "DEFAULT (datetime('now'))");
  
    return sql;
  }
  
  /**
   * Execute a single SQL statement
   */
  async executeStatement(statement) {
    try {
      const sqliteStatement = this.convertToSQLite(statement);
      console.log('Executing statement:', sqliteStatement.substring(0, 100) + '...');
      await this.pool.query(sqliteStatement);
    } catch (err) {
      // Ignore errors for already existing columns/tables
      const msg = err.message.toLowerCase();
      if (msg.includes('duplicate column name') || msg.includes('already exists')) {
        console.log('Skipping (already exists):', statement.substring(0, 50) + '...');
        return;
      }
      console.error('Error executing statement:', statement);
      throw err;
    }
  }

  /**
   * Run a single migration file
   */
  async runMigrationFile(filePath, fileName) {
    console.log(`Running migration: ${fileName}`);
    try {
      const sql = fs.readFileSync(filePath, 'utf-8');
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      for (const statement of statements) {
        await this.executeStatement(statement);
      }
      console.log(`Migration ${fileName} completed successfully`);
    } catch (error) {
      console.error(`Migration ${fileName} failed:`, error);
      // Continue with other migrations even if one fails
    }
  }

  /**
   * Run all migrations in the correct order
   */
  async runAllMigrations() {
    // In development, delete old DB file so we start clean each run
    if (process.env.NODE_ENV !== 'production') {
      if (fs.existsSync(this.dbFile)) {
        fs.unlinkSync(this.dbFile);
        console.log(`🗑  Cleared DB file at ${this.dbFile}`);
      } else {
        console.log(`✅  No existing DB file to clear at ${this.dbFile}`);
      }
    }

    try {
      if (!fs.existsSync(this.migrationsDir)) {
        console.log('No migrations directory found, skipping migrations...');
        return;
      }

      const orderedMigrations = [
        'database_schema.sql',
        'create_merkle_tree_tables.sql',
        'add_nullifier_hash_column.sql',
        'fix_users_table_structure.sql'
      ];

      for (const fileName of orderedMigrations) {
        const filePath = path.join(this.migrationsDir, fileName);
        if (fs.existsSync(filePath)) {
          await this.runMigrationFile(filePath, fileName);
        }
      }

      const allFiles = fs.readdirSync(this.migrationsDir)
        .filter(f => f.endsWith('.sql') && !orderedMigrations.includes(f))
        .sort();

      for (const fileName of allFiles) {
        const filePath = path.join(this.migrationsDir, fileName);
        await this.runMigrationFile(filePath, fileName);
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      // Do not rethrow
    }
  }
}

module.exports = MigrationRunner;
