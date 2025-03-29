const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt for username:", username);

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log("Admin user not found for username:", username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Stored hashed password:", admin.password);
    const isPasswordValid = await admin.comparePassword(password);
    console.log("Password comparison result:", isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
