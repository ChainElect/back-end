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

const SALT_ROUNDS = 10;

// Route for user registration
router.post('/register', async (req, res) => {
  const { commitment_hash, password, is_admin } = req.body;
  console.log(req.body);
  console.log("Registering user :", commitment_hash, password, is_admin);
  try {
    // Hash both id_number and password
    const hashedCommitent = await bcrypt.hash(commitment_hash, SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user into database
    const query = `
      INSERT INTO users (commitment, password_hash, is_admin)
      VALUES ($1, $2, $3)
      RETURNING id`;
    
    const values = [hashedCommitent, hashedPassword, is_admin || false];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.rows[0].id
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'User with this ID number already exists'
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
});

router.post('/login', async (req, res) => {
  const { idNumber, password } = req.body;
  console.log("Login data:", req.body);
  try {
    // Need to retrieve all users since id_number is hashed
    const allUsersQuery = 'SELECT * FROM users';
    const allUsers = await pool.query(allUsersQuery);
    
    // Find user by comparing provided id_number with stored hashes
    let user = null;
    for (const currentUser of allUsers.rows) {
      const idMatches = await bcrypt.compare(idNumber, currentUser.commitment);
      if (idMatches) {
        user = currentUser;
        console.log("User found:", user);
        break;
      }
    }

    // If no user found with matching id_number
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { algorithm: process.env.HASHING_ALGORITHM || "HS256", expiresIn: "1h" }
    );

    res.json({ token, message: SUCCESS_MESSAGES.LOGIN_SUCCESS });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
});

module.exports = router;
