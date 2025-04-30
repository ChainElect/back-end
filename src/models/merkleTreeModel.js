const pool = require("../config/db");

/**
 * Get the latest Merkle root from the database
 * @returns {Promise<string|null>} Latest root or null if no roots exist
 */
exports.getLatestRoot = async () => {
  try {
    const result = await pool.query(
      "SELECT root FROM merkle_tree_roots ORDER BY created_at DESC LIMIT 1"
    );
    return result.rows.length ? result.rows[0].root : null;
  } catch (error) {
    console.error("Error getting latest Merkle root:", error);
    throw error;
  }
};

/**
 * Save a new Merkle root to the database
 * @param {string} root - The Merkle root to save
 * @returns {Promise<Object>} The saved root record
 */
exports.saveRoot = async (root) => {
  try {
    const result = await pool.query(
      "INSERT INTO merkle_tree_roots (root) VALUES ($1) RETURNING *",
      [root]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error saving Merkle root:", error);
    throw error;
  }
};

/**
 * Get all commitments from the database
 * @returns {Promise<Array<string>>} Array of commitment values
 */
exports.getAllCommitments = async () => {
  try {
    const result = await pool.query(
      "SELECT commitment FROM merkle_tree_commitments"
    );
    return result.rows.map(row => row.commitment);
  } catch (error) {
    console.error("Error getting commitments:", error);
    throw error;
  }
};

/**
 * Save a new commitment to the database
 * @param {string} commitment - The commitment to save
 * @param {string} nullifierHash - Optional nullifier hash
 * @returns {Promise<Object>} The saved commitment record
 */
exports.saveCommitment = async (commitment, nullifierHash = null) => {
  try {
    // Standardize commitment as string
    const commitmentStr = commitment.toString();
    
    const result = await pool.query(
      "INSERT INTO merkle_tree_commitments (commitment, nullifier_hash) VALUES ($1, $2) RETURNING *",
      [commitmentStr, nullifierHash]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error saving commitment:", error);
    throw error;
  }
};

/**
 * Check if a commitment exists in the database
 * @param {string} commitment - The commitment to check
 * @returns {Promise<boolean>} True if commitment exists
 */
exports.commitmentExists = async (commitment) => {
  try {
    // Standardize commitment as string
    const commitmentStr = commitment.toString();
    
    const result = await pool.query(
      "SELECT 1 FROM merkle_tree_commitments WHERE commitment = $1",
      [commitmentStr]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking commitment:", error);
    throw error;
  }
};

/**
 * Check if a nullifier has been used (for preventing double voting)
 * @param {string} nullifierHash - The nullifier hash to check
 * @returns {Promise<boolean>} True if nullifier has been used
 */
exports.nullifierExists = async (nullifierHash) => {
  try {
    // Standardize nullifierHash as string
    const nullifierHashStr = nullifierHash.toString();
    
    const result = await pool.query(
      "SELECT 1 FROM merkle_tree_commitments WHERE nullifier_hash = $1 AND used = TRUE",
      [nullifierHashStr]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking nullifier:", error);
    throw error;
  }
};

/**
 * Mark a nullifier as used
 * @param {string} nullifierHash - The nullifier hash to mark as used
 * @returns {Promise<boolean>} True if operation succeeded
 */
exports.markNullifierUsed = async (nullifierHash) => {
  try {
    // Standardize nullifierHash as string
    const nullifierHashStr = nullifierHash.toString();
    
    const result = await pool.query(
      "UPDATE merkle_tree_commitments SET used = TRUE WHERE nullifier_hash = $1",
      [nullifierHashStr]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error marking nullifier as used:", error);
    throw error;
  }
};