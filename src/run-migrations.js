const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    // Read and execute the merkle tree tables migration
    const merkleTreeMigration = fs.readFileSync(
      path.join(__dirname, 'migrations/create_merkle_tree_tables.sql'),
      'utf8'
    );
    
    await pool.query(merkleTreeMigration);
    console.log('✓ Merkle tree tables created');

    // Read and execute the database schema migration
    const schemaMigration = fs.readFileSync(
      path.join(__dirname, 'migrations/database_schema.sql'),
      'utf8'
    );
    
    await pool.query(schemaMigration);
    console.log('✓ Database schema created');

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();