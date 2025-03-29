const express = require("express");
const router = express.Router();
const NewsItem = require("../models/news"); // Assuming you have a NewsItem model
const authenticateAdmin = require("../middleware/auth");

// --- API Endpoints for News ---

// GET All News Items (Public)
router.get("/", async (req, res) => {
  try {
    const newsItems = await NewsItem.find().sort({ createdAt: "desc" }); // Sort by creation date
    res.json(newsItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New News Item (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const newsItem = new NewsItem({
    title: req.body.title,
    content: req.body.content,
    image: req.body.image,
    createdAt: req.body.createdAt || Date.now(),
  });

  try {
    const newNewsItem = await newsItem.save();
    res.status(201).json(newNewsItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT Update News Item by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const newsItem = await NewsItem.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ message: "Cannot find news item" });
    }
    if (req.body.title) newsItem.title = req.body.title;
    if (req.body.content) newsItem.content = req.body.content;
    if (req.body.image) newsItem.image = req.body.image;
    if (req.body.createdAt) newsItem.createdAt = req.body.createdAt;

    const updatedNewsItem = await newsItem.save();
    res.json(updatedNewsItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE News Item by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const newsItem = await NewsItem.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ message: "Cannot find news item" });
    }
    await newsItem.remove();
    res.json({ message: "Deleted news item" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
