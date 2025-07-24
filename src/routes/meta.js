const express = require("express");
const router = express.Router();
const Meta = require("../models/meta");
const authenticateAdmin = require("../middleware/auth"); // Assuming you have this

// GET meta data for a specific page
// Publicly accessible
router.get("/:pageIdentifier", async (req, res) => {
  try {
    const meta = await Meta.findOne({ pageIdentifier: req.params.pageIdentifier });
    if (!meta) {
      // Optionally, create a default if it doesn't exist for some identifiers on first access
      // Or just return 404 / empty object
      return res.status(404).json({ message: "Meta data not found for this page." });
    }
    res.json(meta);
  } catch (err) {
    res.status(500).json({ message: "Error fetching meta data: " + err.message });
  }
});

// GET all meta data entries (for admin panel)
// Admin access only
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const allMetaData = await Meta.find().sort({ pageIdentifier: 1 });
    res.json(allMetaData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching all meta data: " + err.message });
  }
});

// POST/PUT (Upsert) meta data for a specific page
// Admin access only
router.put("/:pageIdentifier", authenticateAdmin, async (req, res) => {
  const { pageIdentifier } = req.params;
  const updateData = req.body;

  // Remove pageIdentifier from updateData if present to avoid trying to change it
  delete updateData.pageIdentifier;
  delete updateData._id; // Don't allow changing _id
  delete updateData.createdAt;
  delete updateData.updatedAt;

  try {
    // Find and update, or create if it doesn't exist (upsert)
    const updatedMeta = await Meta.findOneAndUpdate(
      { pageIdentifier: pageIdentifier },
      { $set: updateData }, // Use $set to update only provided fields
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(updatedMeta);
  } catch (err) {
    console.error("Error upserting meta data:", err);
    res.status(400).json({ message: "Error updating meta data: " + err.message });
  }
});

module.exports = router;
