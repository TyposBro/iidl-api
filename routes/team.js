const express = require("express");
const router = express.Router();
const TeamMember = require("../models/team");
const authenticateAdmin = require("../middleware/auth");

// --- API Endpoints for Team Members ---

// GET All Team Members (Public)
router.get("/", async (req, res) => {
  try {
    const teamMembers = await TeamMember.find();
    res.json(teamMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Team Member (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const teamMember = new TeamMember({
    name: req.body.name,
    role: req.body.role,
    img: req.body.img,
  });

  try {
    const newTeamMember = await teamMember.save();
    res.status(201).json(newTeamMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET Team Member by ID (Public - Optional, if needed)
router.get("/:id", async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ message: "Cannot find team member" });
    }
    res.json(teamMember);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Update Team Member by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ message: "Cannot find team member" });
    }
    if (req.body.name) teamMember.name = req.body.name;
    if (req.body.role) teamMember.role = req.body.role;
    if (req.body.img) teamMember.img = req.body.img;

    const updatedTeamMember = await teamMember.save();
    res.json(updatedTeamMember);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Team Member by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ message: "Cannot find team member" });
    }
    await teamMember.remove();
    res.json({ message: "Deleted team member" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
