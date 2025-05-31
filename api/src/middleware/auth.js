// {PATH_TO_THE_PROJECT}/api/src/middleware/auth.js
// Middleware to authenticate admin users
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config"); // Adjust path if needed

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.adminId = decoded.adminId;
    next();
  });
};

module.exports = authenticateAdmin;
