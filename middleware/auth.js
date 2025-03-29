require("dotenv").config();
const bcrypt = require("bcrypt"); // Import if you decide to hash

const adminPassword = process.env.ADMIN_PASSWORD;

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const decodedCredentials = Buffer.from(base64Credentials, "base64").toString("utf-8").split(":");

  if (decodedCredentials.length !== 2) {
    return res.status(401).json({ message: "Invalid credentials format" });
  }

  const [username, password] = decodedCredentials;

  // In a real application, you might have an admin username as well
  // For simplicity here, we're just checking the password

  if (password === adminPassword) {
    req.isAdmin = true; // Optionally add an isAdmin flag to the request
    next();
  } else {
    return res.status(401).json({ message: "Invalid password" });
  }
};

module.exports = authenticateAdmin;
