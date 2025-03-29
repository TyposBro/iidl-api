const express = require("express");
const router = express.Router();
const Project = require("../models/project");
const authenticateAdmin = require("../middleware/auth");

// --- API Endpoints for Projects ---

// GET All Projects (Public - Filter by status if provided)
router.get("/", async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  try {
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Project (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const project = new Project({
    title: req.body.title,
    description: req.body.description,
    image: req.body.image,
    link: req.body.link,
    tags: req.body.tags,
    status: req.body.status,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
  });

  try {
    const newProject = await project.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET Project by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Cannot find project" });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Update Project by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Cannot find project" });
    }
    if (req.body.title) project.title = req.body.title;
    if (req.body.description) project.description = req.body.description;
    if (req.body.image) project.image = req.body.image;
    if (req.body.link) project.link = req.body.link;
    if (req.body.tags) project.tags = req.body.tags;
    if (req.body.status) project.status = req.body.status;
    if (req.body.startDate) project.startDate = req.body.startDate;
    if (req.body.endDate) project.endDate = req.body.endDate;
    project.updatedAt = Date.now();

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Project by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Cannot find project" });
    }
    await project.remove();
    res.json({ message: "Deleted project" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
