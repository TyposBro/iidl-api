// {PATH_TO_THE_PROJECT}/api/src/routes/news.js
// This file defines the API routes for managing news items.
// It includes routes for getting all news items, creating a new news item,
// updating an existing news item, and deleting a news item.
// It uses Express.js for routing and Mongoose for database interactions.
// It exports the router for use in other parts of the application.
//

const express = require("express");
const router = express.Router();
const NewsItem = require("../models/news"); // Assuming you have a NewsItem model
const authenticateAdmin = require("../middleware/auth");

// --- API Endpoints for News ---

// GET All News Items (Public)
router.get("/", async (req, res) => {
  try {
    const newsItems = await NewsItem.find().sort({ number: -1 });
    res.json(newsItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New News Item (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const newsItem = new NewsItem({
    title: req.body.title,
    number: req.body.number,
    content: req.body.content,
    images: req.body.images,
    date: req.body.date || Date.now(),
    type: req.body.type,
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
    if (req.body.number) newsItem.number = req.body.number;
    if (req.body.content) newsItem.content = req.body.content;
    if (req.body.images) newsItem.images = req.body.images;
    if (req.body.type) newsItem.type = req.body.type;
    if (req.body.date) newsItem.date = req.body.date;

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
    await newsItem.deleteOne();
    res.json({ message: "Deleted news item" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
