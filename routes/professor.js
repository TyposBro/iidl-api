const express = require("express");
const router = express.Router();
const Professor = require("../models/professor");
const authenticateAdmin = require("../middleware/auth");

// GET Professor Data (Public)
router.get("/", async (req, res) => {
  try {
    const professor = await Professor.find();
    res.json(professor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Professor (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const professor = new Professor({
    name: req.body.name,
    role: req.body.role,
    img: req.body.img,
    desc: req.body.desc,
    cvLink: req.body.cvLink,
  });

  try {
    const newProfessor = await professor.save();
    res.status(201).json(newProfessor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT Update Professor by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id);
    if (!professor) {
      return res.status(404).json({ message: "Cannot find professor" });
    }
    if (req.body.name) professor.name = req.body.name;
    if (req.body.role) professor.role = req.body.role;
    if (req.body.img) professor.img = req.body.img;
    if (req.body.desc) professor.desc = req.body.desc;
    if (req.body.cvLink) professor.cvLink = req.body.cvLink;

    const updatedProfessor = await professor.save();
    res.json(updatedProfessor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Professor by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id);
    if (!professor) {
      return res.status(404).json({ message: "Cannot find professor" });
    }
    await professor.remove();
    res.json({ message: "Deleted professor" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
