// {PATH_TO_THE_PROJECT}/api/src/routes/professor.js
// This file defines the routes for managing professors in the application.
// It includes routes for getting all professors, adding a new professor,
// updating an existing professor, and deleting a professor.
// It uses Express.js for routing and Mongoose for database operations.
// It exports the router for use in other parts of the application.
//
const express = require("express");
const router = express.Router();
const Professor = require("../models/professor");
const authenticateAdmin = require("../middleware/auth");

// GET all professor
router.get("/", async (req, res) => {
  console.log("Fetching all professors");
  try {
    const professor = await Professor.findOne();
    res.json(professor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST/PUT professor
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    // Check if a professor already exists
    const existingProf = await Professor.findOne();
    if (existingProf) {
      return res.status(400).json({ message: "Professor already exists. Use PUT to update." });
    }

    const professor = new Professor(req.body);
    const newProfessor = await professor.save();
    res.status(201).json(newProfessor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const professor = await Professor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }
    res.json(professor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE professor
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const professor = await Professor.findByIdAndDelete(req.params.id);
    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }
    res.json({ message: "Professor deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
