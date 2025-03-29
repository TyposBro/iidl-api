const express = require("express");
const router = express.Router();
const JournalPaper = require("../models/journalPaper"); // Assuming you have a JournalPaper model
const ConferencePaper = require("../models/conferencePaper"); // Assuming you have a ConferencePaper model
const authenticateAdmin = require("../middleware/auth");

// --- API Endpoints for Publications ---

// --- Journal Papers ---

// GET All Journal Papers (Public)
router.get("/journals", async (req, res) => {
  try {
    const journalPapers = await JournalPaper.find().sort({ year: "desc" });
    res.json(journalPapers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Journal Paper (Admin Only)
router.post("/journals", authenticateAdmin, async (req, res) => {
  const journalPaper = new JournalPaper({
    title: req.body.title,
    authors: req.body.authors,
    year: req.body.year,
    publisher: req.body.publisher,
    link: req.body.link,
    color: req.body.color,
    type: req.body.type,
  });

  try {
    const newJournalPaper = await journalPaper.save();
    res.status(201).json(newJournalPaper);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT Update Journal Paper by ID (Admin Only)
router.put("/journals/:id", authenticateAdmin, async (req, res) => {
  try {
    const journalPaper = await JournalPaper.findById(req.params.id);
    if (!journalPaper) {
      return res.status(404).json({ message: "Cannot find journal paper" });
    }
    if (req.body.title) journalPaper.title = req.body.title;
    if (req.body.authors) journalPaper.authors = req.body.authors;
    if (req.body.year) journalPaper.year = req.body.year;
    if (req.body.publisher) journalPaper.publisher = req.body.publisher;
    if (req.body.link) journalPaper.link = req.body.link;
    if (req.body.color) journalPaper.color = req.body.color;
    if (req.body.type) journalPaper.type = req.body.type;

    const updatedJournalPaper = await journalPaper.save();
    res.json(updatedJournalPaper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Journal Paper by ID (Admin Only)
router.delete("/journals/:id", authenticateAdmin, async (req, res) => {
  try {
    const journalPaper = await JournalPaper.findById(req.params.id);
    if (!journalPaper) {
      return res.status(404).json({ message: "Cannot find journal paper" });
    }
    await journalPaper.remove();
    res.json({ message: "Deleted journal paper" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Conference Papers ---

// GET All Conference Papers (Public)
router.get("/conferences", async (req, res) => {
  try {
    const conferencePapers = await ConferencePaper.find().sort({ year: "desc" });
    res.json(conferencePapers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Conference Paper (Admin Only)
router.post("/conferences", authenticateAdmin, async (req, res) => {
  const conferencePaper = new ConferencePaper({
    title: req.body.title,
    authors: req.body.authors,
    year: req.body.year,
    publisher: req.body.publisher,
    location: req.body.location,
    link: req.body.link,
    color: req.body.color,
    type: req.body.type,
  });

  try {
    const newConferencePaper = await conferencePaper.save();
    res.status(201).json(newConferencePaper);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT Update Conference Paper by ID (Admin Only)
router.put("/conferences/:id", authenticateAdmin, async (req, res) => {
  try {
    const conferencePaper = await ConferencePaper.findById(req.params.id);
    if (!conferencePaper) {
      return res.status(404).json({ message: "Cannot find conference paper" });
    }
    if (req.body.title) conferencePaper.title = req.body.title;
    if (req.body.authors) conferencePaper.authors = req.body.authors;
    if (req.body.year) conferencePaper.year = req.body.year;
    if (req.body.publisher) conferencePaper.publisher = req.body.publisher;
    if (req.body.location) conferencePaper.location = req.body.location;
    if (req.body.link) conferencePaper.link = req.body.link;
    if (req.body.color) conferencePaper.color = req.body.color;
    if (req.body.type) conferencePaper.type = req.body.type;

    const updatedConferencePaper = await conferencePaper.save();
    res.json(updatedConferencePaper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Conference Paper by ID (Admin Only)
router.delete("/conferences/:id", authenticateAdmin, async (req, res) => {
  try {
    const conferencePaper = await ConferencePaper.findById(req.params.id);
    if (!conferencePaper) {
      return res.status(404).json({ message: "Cannot find conference paper" });
    }
    await conferencePaper.remove();
    res.json({ message: "Deleted conference paper" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
