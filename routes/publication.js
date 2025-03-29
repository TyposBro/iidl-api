const express = require("express");
const router = express.Router();
const Publication = require("../models/publication");
const authenticateAdmin = require("../middleware/auth");

// --- API Endpoints for Publications ---

// GET All Publications (Public)
router.get("/", async (req, res) => {
  try {
    const publications = await Publication.find().sort({ year: -1, createdAt: -1 });
    res.json(publications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Publication (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const publication = new Publication({
    title: req.body.title,
    authors: req.body.authors,
    journal: req.body.journal,
    year: req.body.year,
    doi: req.body.doi,
    link: req.body.link,
    abstract: req.body.abstract,
  });

  try {
    const newPublication = await publication.save();
    res.status(201).json(newPublication);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET Publication by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Cannot find publication" });
    }
    res.json(publication);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Update Publication by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Cannot find publication" });
    }
    if (req.body.title) publication.title = req.body.title;
    if (req.body.authors) publication.authors = req.body.authors;
    if (req.body.journal) publication.journal = req.body.journal;
    if (req.body.year) publication.year = req.body.year;
    if (req.body.doi) publication.doi = req.body.doi;
    if (req.body.link) publication.link = req.body.link;
    if (req.body.abstract) publication.abstract = req.body.abstract;
    publication.updatedAt = Date.now();

    const updatedPublication = await publication.save();
    res.json(updatedPublication);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Publication by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Cannot find publication" });
    }
    await publication.remove();
    res.json({ message: "Deleted publication" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
