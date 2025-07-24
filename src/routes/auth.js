// {PATH_TO_THE_PROJECT}/src/routes/auth.js
// This file defines an Express router for handling authentication-related routes.
// It includes a login route for admin users.
// The login route checks the provided username and password against the database.
// If the credentials are valid, it generates a JWT token and sends it back to the client.
// It uses bcrypt for password hashing and JWT for token generation.
// It exports the router for use in other parts of the application.
//

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const { jwtSecret } = require("../config");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt for username:", username);

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log("Admin user not found for username:", username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (password !== admin.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ adminId: admin._id }, jwtSecret, { expiresIn: "1h" });

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
