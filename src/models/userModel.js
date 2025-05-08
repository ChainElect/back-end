const pool = require("../config/db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

exports.saveUser = async ({ commitment, password, is_admin }) => {

  if (!commitment || !password) {
    throw new Error("ID number and password are required");
  }

  // Hash both id_number and password with bcrypt
  const hashedCommitent = await bcrypt.hash(commitment.toString(), SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password.toString(), SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (commitment, password_hash, is_admin)
      VALUES ($1, $2, $3)
      RETURNING *`,
    [hashedCommitent,  hashedPassword, is_admin || false]
  );
  return result.rows[0];
};

exports.verifyPassword = async (storedHash, providedPassword) => {
  return await bcrypt.compare(providedPassword, storedHash);
};

exports.verifyIdNumber = async (storedHash, providedIdNumber) => {
  return await bcrypt.compare(providedIdNumber, storedHash);
};

exports.findUserByIdNumber = async (idNumber) => {
  // Get all users since we can't query directly by the hashed id_number
  const allUsers = await pool.query("SELECT * FROM users");

  // Find user by comparing plain id_number with stored hashes
  for (const user of allUsers.rows) {
    if (await bcrypt.compare(idNumber, user.id_number)) {
      return user;
    }
  }

  return null;
};

// If you need to find a user by ID (primary key)
exports.findUserById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};