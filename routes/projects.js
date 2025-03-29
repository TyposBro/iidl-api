const express = require("express");
const router = express.Router();
const Project = require("../models/project"); // Assuming you have a Project model
const authenticateAdmin = require("../middleware/auth");

// --- API Endpoints for Projects ---

// GET All Projects (Public)
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Current Projects (Public)
router.get("/current", async (req, res) => {
  try {
    const currentProjects = await Project.find({ status: "current" }); // Adjust query as needed
    res.json(currentProjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Completed Projects (Public)
router.get("/completed", async (req, res) => {
  try {
    const completedProjects = await Project.find({ status: "completed" }); // Adjust query as needed
    res.json(completedProjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Project (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const project = new Project({
    title: req.body.title,
    desc: req.body.desc,
    img: req.body.img,
    status: req.body.status || "current", // Default status
    link: req.body.link,
  });

  try {
    const newProject = await project.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    if (req.body.desc) project.desc = req.body.desc;
    if (req.body.img) project.img = req.body.img;
    if (req.body.status) project.status = req.body.status;
    if (req.body.link) project.link = req.body.link;

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
