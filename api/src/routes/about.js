// {PATH_TO_THE_PROJECT}/api/src/routes/about.js
const express = require("express");
const router = express.Router();
const AboutPage = require("../models/about");
const verifyToken = require("../middleware/authMiddleware"); // Assuming you have this middleware

// GET /api/about - Get the current About page content (No changes needed)
router.get("/", async (req, res) => {
  try {
    // Fetch the single document for the about page
    const aboutContent = await AboutPage.findOne();
    // If no document exists yet, return 404 (frontend will handle creation prompt)
    if (!aboutContent) {
      return res.status(404).json({ message: "About page content not found." });
    }
    res.status(200).json(aboutContent);
  } catch (err) {
    console.error("Error fetching about content:", err);
    res.status(500).send("Internal Server Error");
  }
});

// PUT /api/about - Admin: Update or Create About page content
// Use verifyToken middleware to protect this route
router.put("/", verifyToken, async (req, res) => {
  try {
    // Destructure the expected new structure from the request body
    const { head, body } = req.body;

    // Basic validation (more robust validation can be added)
    if (!head || !body || !head.title || !head.description || !body.title) {
      return res
        .status(400)
        .json({ message: "Missing required fields (head.title, head.description, body.title)." });
    }
    // Validate structure of body.list if present
    if (body.list && !Array.isArray(body.list)) {
      return res.status(400).json({ message: "body.list must be an array." });
    }
    // Could add deeper validation for items within body.list here

    // Use findOneAndUpdate with upsert:true to create if not found, or update if found
    const updatedAboutPage = await AboutPage.findOneAndUpdate(
      {}, // Empty filter object matches the single document
      { $set: { head, body } }, // Use $set to update specified fields
      {
        new: true, // Return the updated document
        upsert: true, // Create the document if it doesn't exist
        runValidators: true, // Ensure schema validation rules are applied
      }
    );

    // Should always return a document because of upsert:true
    res.status(200).json(updatedAboutPage);
  } catch (err) {
    console.error("Error updating about content:", err);
    // Handle validation errors specifically
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Validation Error", errors: err.errors });
    }
    res.status(500).send("Internal Server Error");
  }
});

// DELETE /api/about - Admin: Delete About page content (Optional)
// Use verifyToken middleware
router.delete("/", verifyToken, async (req, res) => {
  try {
    const result = await AboutPage.deleteOne({}); // Delete the single document
    if (result.deletedCount === 0) {
      return res.status(404).send("About page content not found to delete.");
    }
    res.status(200).send("About page content deleted successfully.");
  } catch (err) {
    console.error("Error deleting about content:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
