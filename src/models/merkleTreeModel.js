const pool = require("../config/db");

/**
 * Get the latest Merkle root from the database
 */
exports.getLatestRoot = async () => {
  const result = await pool.query(
    "SELECT root FROM merkle_tree_roots ORDER BY created_at DESC LIMIT 1"
  );
  return result.rows.length ? result.rows[0].root : null;
};

/**
 * Save a new Merkle root to the database
 */
exports.saveRoot = async (root) => {
  const result = await pool.query(
    "INSERT INTO merkle_tree_roots (root) VALUES ($1) RETURNING *",
    [root]
  );
  return result.rows[0];
};

/**
 * Get all commitments from the database
 */
exports.getAllCommitments = async () => {
  const result = await pool.query(
    "SELECT commitment FROM merkle_tree_commitments"
  );
  return result.rows.map(row => row.commitment);
};

/**
 * Save a new commitment to the database
 */
exports.saveCommitment = async (commitment) => {
  const result = await pool.query(
    "INSERT INTO merkle_tree_commitments (commitment) VALUES ($1) RETURNING *",
    [commitment]
  );
  return result.rows[0];
};