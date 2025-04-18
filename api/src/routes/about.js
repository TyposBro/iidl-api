// {PATH_TO_THE_PROJECT}/api/src/routes/about.js
// This file defines the routes for the About page.
// It includes routes for getting, updating, and deleting the About page content.
// It uses Express.js for routing and Mongoose for database operations.
// It exports the router for use in other parts of the application.
//
const express = require("express");
const router = express.Router();
const AboutPage = require("../models/about");

// Get the current About page content
router.get("/", async (req, res) => {
  try {
    const aboutContent = await AboutPage.findOne();
    if (!aboutContent) return res.status(404).json("About page content not found.");
    res.status(200).json(aboutContent);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Admin: Update About page content
router.put("/", async (req, res) => {
  try {
    const { intro, tracks, details } = req.body;
    const updatedAboutPage = await AboutPage.findOneAndUpdate(
      {},
      { intro, tracks, details },
      { new: true, upsert: true } // If no content exists, it will be created
    );
    res.status(200).json(updatedAboutPage);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Admin: Delete About page content
router.delete("/", async (req, res) => {
  try {
    await AboutPage.deleteOne({});
    res.status(200).send("About page content deleted.");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
