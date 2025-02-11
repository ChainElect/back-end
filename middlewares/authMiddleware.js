/**
 * @module authMiddleware
 * @description Express middleware for authenticating requests using JWT.
 * Loads environment variables and verifies JWT tokens attached to incoming requests.
 */

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");

dotenv.config();

/**
 * @summary Middleware to authenticate requests using JWT.
 * @description Extracts the JWT from the "Authorization" header, verifies it using the secret
 * from environment variables, and attaches the decoded token payload to `req.user`. If the token
 * is missing or invalid, a 401 Unauthorized response is returned.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded token payload (e.g., user ID) to request
    next();
  } catch (error) {
    res.status(401).json({ error: ERROR_MESSAGES.INVALID_TOKEN });
  }
}

module.exports = authMiddleware;
