const express = require("express");
const router = express.Router();
const GalleryEvent = require("../models/gallery");
const authenticateAdmin = require("../middleware/auth");

// --- API Endpoints for Gallery ---

// GET All Gallery Events (Public)
router.get("/", async (req, res) => {
  try {
    const galleryEvents = await GalleryEvent.find().sort({ year: "desc" });
    res.json(galleryEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Gallery Event (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const galleryEvent = new GalleryEvent({
    title: req.body.title,
    year: req.body.year,
    location: req.body.location,
    images: req.body.images,
    type: req.body.type,
  });

  try {
    const newGalleryEvent = await galleryEvent.save();
    res.status(201).json(newGalleryEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT Update Gallery Event by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const galleryEvent = await GalleryEvent.findById(req.params.id);
    if (!galleryEvent) {
      return res.status(404).json({ message: "Cannot find gallery event" });
    }
    if (req.body.title) galleryEvent.title = req.body.title;
    if (req.body.year) galleryEvent.year = req.body.year;
    if (req.body.location) galleryEvent.location = req.body.location;
    if (req.body.images) galleryEvent.images = req.body.images;
    if (req.body.type) galleryEvent.type = req.body.type;

    const updatedGalleryEvent = await galleryEvent.save();
    res.json(updatedGalleryEvent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Gallery Event by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const galleryEvent = await GalleryEvent.findById(req.params.id);
    if (!galleryEvent) {
      return res.status(404).json({ message: "Cannot find gallery event" });
    }
    await galleryEvent.remove();
    res.json({ message: "Deleted gallery event" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
