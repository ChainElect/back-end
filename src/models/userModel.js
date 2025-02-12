const pool = require("../config/db");

exports.saveUser = async ({ name, dob, idNumber }) => {
  const result = await pool.query(
    "INSERT INTO users (name, dob, id_number) VALUES ($1, $2, $3) RETURNING *",
    [name, dob, idNumber]
  );
  return result.rows[0];
};
