// {PATH_TO_THE_PROJECT}/api/src/routes/gallery.js
// This file defines the API routes for managing gallery events.
// It includes routes for getting all gallery events, creating a new event,
// updating an event by ID, and deleting an event by ID.
// It uses Express.js for routing and Mongoose for database operations.
// It also includes authentication middleware for admin-only routes.
// It exports the router for use in other parts of the application.
//

const express = require("express");
const router = express.Router();
const GalleryEvent = require("../models/gallery");
const authenticateAdmin = require("../middleware/auth");
const supabase = require("../supabaseClient"); // Import Supabase client

// --- API Endpoints for Gallery ---

// GET All Gallery Events (Public)
router.get("/", async (req, res) => {
  try {
    const galleryEvents = await GalleryEvent.find().sort({ date: "desc" }); // Sort by date
    res.json(galleryEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Gallery Event (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const galleryEvent = new GalleryEvent({
    title: req.body.title,
    date: req.body.date,
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

// Function to extract filename from URL
const extractFilenameFromUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const parts = pathname.split("/");
    return parts[parts.length - 1];
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
};

// PUT Update Gallery Event by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const galleryEvent = await GalleryEvent.findById(req.params.id);
    if (!galleryEvent) {
      return res.status(404).json({ message: "Cannot find gallery event" });
    }

    const oldImages = galleryEvent.images || [];
    const newImages = req.body.images || [];
    const bucketName = process.env.SUPABASE_BUCKET_NAME;

    // Identify images to delete
    const imagesToDelete = oldImages.filter((oldImage) => !newImages.includes(oldImage));

    // Delete old images from Supabase
    for (const imageUrl of imagesToDelete) {
      const filename = extractFilenameFromUrl(imageUrl);
      if (filename) {
        const { error } = await supabase.storage.from(bucketName).remove([filename]);
        if (error) {
          console.error("Error deleting image from Supabase:", error);
          // Optionally, you might want to handle this error more specifically
        } else {
          console.log(`Deleted image: ${filename}`);
        }
      }
    }

    if (req.body.title) galleryEvent.title = req.body.title;
    if (req.body.date) galleryEvent.date = req.body.date;
    if (req.body.location) galleryEvent.location = req.body.location;
    galleryEvent.images = newImages; // Update with the new array of images
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

    const imagesToDelete = galleryEvent.images || [];
    const bucketName = process.env.SUPABASE_BUCKET_NAME;

    // Delete associated images from Supabase
    for (const imageUrl of imagesToDelete) {
      const filename = extractFilenameFromUrl(imageUrl);
      if (filename) {
        const { error } = await supabase.storage.from(bucketName).remove([filename]);
        if (error) {
          console.error("Error deleting image from Supabase:", error);
          // Optionally, you might want to handle this error more specifically
        } else {
          console.log(`Deleted image: ${filename}`);
        }
      }
    }

    await galleryEvent.deleteOne();
    res.json({ message: "Deleted gallery event" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
