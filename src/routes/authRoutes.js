// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");
const authMiddleware = require("../middlewares/authMiddleware"); // Import the authentication middleware
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

// Register Endpoint
// Register Endpoint
router.post("/register", async (req, res) => {
  const { fullName, password, idNumber, dob } = req.body;

  // Check if required fields are present
  if (!fullName || !password || !idNumber || !dob) {
    return res.status(400).json({ 
      error: "All fields are required: fullName, password, idNumber, and dob (date of birth)"
    });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const result = await pool.query(
      "INSERT INTO users (full_name, password_hash, id_number, dob) VALUES ($1, $2, $3, $4) RETURNING id",
      [fullName, hashedPassword, idNumber, dob]
    );

    res.status(201).json({
      message: SUCCESS_MESSAGES.AUTH.USER_REGISTERED,
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    
    // Provide more specific error messages
    if (error.code === '23505') {
      return res.status(400).json({ error: "User with this ID number already exists" });
    }
    
    res.status(500).json({ error: ERROR_MESSAGES.DATABASE_ERROR });
  }
});

// Login Endpoint
router.post("/login", async (req, res) => {
  const { idNumber, password } = req.body;

  try {
    // Find user by ID number
    const userResult = await pool.query(
      "SELECT * FROM users WHERE id_number = $1",
      [idNumber]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    const user = userResult.rows[0];

    // Compare provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }

    // Generate a JWT token with isAdmin information
    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { algorithm: process.env.HASHING_ALGORITHM || "HS256", expiresIn: "1h" }
    );

    res.json({ token, message: SUCCESS_MESSAGES.LOGIN_SUCCESS });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});

// Protected Route
router.get("/protected", authMiddleware, (req, res) => {
  res.status(200).json({
    message: SUCCESS_MESSAGES.PROTECTED_ROUTE_ACCESS,
    userId: req.user.userId,
  });
});

module.exports = router;
