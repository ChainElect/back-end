const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.saveUser = async ({ name, dob, idNumber, password, commitmentHash }) => {
  // Hash the password with bcrypt
  const passwordHash = await bcrypt.hash(password, 10);
  
  const result = await pool.query(
    "INSERT INTO users (full_name, dob, id_number, password_hash, commitment_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [name, dob, idNumber, passwordHash, commitmentHash]
  );
  return result.rows[0];
};

exports.verifyPassword = async (storedHash, providedPassword) => {
  return await bcrypt.compare(providedPassword, storedHash);
};

exports.findUserByIdNumber = async (idNumber) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE id_number = $1",
    [idNumber]
  );
  return result.rows[0] || null;
};