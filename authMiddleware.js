// authMiddleware.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { ERROR_MESSAGES } = require("./utilities/errorMessages");

dotenv.config();

function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ error: ERROR_MESSAGES.ACCESS_DENIED });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user ID to request
    next();
  } catch (error) {
    res.status(401).json({ error: ERROR_MESSAGES.INVALID_TOKEN });
  }
}

module.exports = authMiddleware;
