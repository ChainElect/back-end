const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor(pool) {
    this.pool = pool;
    this.migrationsDir = path.join(__dirname);
  }

  /**
   * Execute a single SQL statement
   */
  async executeStatement(statement) {
    try {
      console.log('Executing statement:', statement.substring(0, 100) + '...');
      await this.pool.query(statement);
    } catch (err) {
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
      
      // Split the SQL file by semicolons to handle multiple statements
      const statements = sql.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        await this.executeStatement(statement);
      }
      
      console.log(`Migration ${fileName} completed successfully`);
    } catch (error) {
      console.error(`Migration ${fileName} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all migrations in the correct order
   */
  async runAllMigrations() {
    try {
      // Check if migrations directory exists
      if (!fs.existsSync(this.migrationsDir)) {
        console.log('No migrations directory found, skipping migrations...');
        return;
      }

      // Define migration files in the order they should be executed
      const orderedMigrations = [
        'add_nullifier_hash_column.sql',
        'fix_users_table_structure.sql',
        'create_merkle_tree_tables.sql',
        'database_schema.sql'
      ];

      // Run ordered migrations first
      for (const fileName of orderedMigrations) {
        const filePath = path.join(this.migrationsDir, fileName);
        if (fs.existsSync(filePath)) {
          await this.runMigrationFile(filePath, fileName);
        }
      }

      // Run any additional migrations that aren't in the ordered list
      const allFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .filter(file => !orderedMigrations.includes(file))
        .sort();

      for (const fileName of allFiles) {
        const filePath = path.join(this.migrationsDir, fileName);
        await this.runMigrationFile(filePath, fileName);
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

module.exports = MigrationRunner;