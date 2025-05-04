// src/config/db.js
const path = require('path');
const Database = require('better-sqlite3');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '../../data');
if (!require('fs').existsSync(dbDir)) {
  require('fs').mkdirSync(dbDir, { recursive: true });
}

// Create SQLite database
const dbPath = path.join(dbDir, 'chainelect.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create a PostgreSQL-compatible interface for SQLite
const pool = {
  query: async (text, params = []) => {
    try {
      // Convert PostgreSQL-style placeholders ($1, $2, etc.) to SQLite style (?, ?, etc.)
      let sqliteQuery = text;
      if (params.length > 0) {
        sqliteQuery = text.replace(/\$(\d+)/g, '?');
      }

      // Handle different types of queries
      if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(sqliteQuery);
        const rows = stmt.all(...params);
        return { rows };
      } else {
        const stmt = db.prepare(sqliteQuery);
        const result = stmt.run(...params);
        
        // For INSERT with RETURNING
        if (sqliteQuery.includes('RETURNING')) {
          const returningMatch = sqliteQuery.match(/RETURNING\s+(.+)$/i);
          if (returningMatch) {
            const columns = returningMatch[1].split(',').map(col => col.trim());
            const selectQuery = `SELECT ${columns.join(', ')} FROM ${sqliteQuery.match(/INSERT INTO\s+(\w+)/i)[1]} WHERE rowid = ?`;
            const selectStmt = db.prepare(selectQuery);
            const rows = selectStmt.all(result.lastInsertRowid);
            return { rows };
          }
        }
        
        return { 
          rows: [], 
          rowCount: result.changes,
          lastID: result.lastInsertRowid 
        };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

module.exports = pool;