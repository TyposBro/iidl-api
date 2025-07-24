// {PATH_TO_THE_PROJECT}/api/src/routes/publication.js
// This file contains the API routes for managing publications.
// It includes routes for creating, reading, updating, and deleting publications.
// It also includes middleware for authentication and authorization.
//

const express = require("express");
const router = express.Router();
const Publication = require("../models/publication"); // Adjust path if needed
const authenticateAdmin = require("../middleware/auth"); // Adjust path if needed
const supabase = require("../supabaseClient"); // Adjust path if needed
const mongoose = require("mongoose");
const { supabaseBucketName } = require("../config"); // Adjust path if needed

// Helper function to extract filename from Supabase URL (ensure this is accessible)
const extractFilenameFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    const pathSegments = urlObject.pathname.split("/");
    const bucketIndex = pathSegments.findIndex((segment) => segment === supabaseBucketName);
    if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
      // Handle paths that might be nested within the bucket
      return decodeURIComponent(pathSegments.slice(bucketIndex + 1).join("/"));
    }
    return null;
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
};

// --- API Endpoints for Publications ---

// GET All Publications (For Admin Panel)
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const publications = await Publication.find().sort({ number: -1 });
    res.json(publications); // Sort by number field
  } catch (err) {
    res.status(500).json({ message: "Error fetching publications: " + err.message });
  }
});

// GET Publications by Type (Public)
router.get("/type/:type", async (req, res) => {
  const validType = ["journal", "conference"];
  const type = req.params.type?.toLowerCase();

  if (!validType.includes(type)) {
    return res.status(400).json({ message: "Invalid publication type specified." });
  }

  try {
    const publications = await Publication.find({ type: type }).sort({ number: 1 });
    res.json(publications);
  } catch (err) {
    res.status(500).json({ message: `Error fetching ${type} publications: ${err.message}` });
  }
});

// POST Create New Publication (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const { title, authors, venue, year, doi, link, abstract, type, location, image, number } =
    req.body;

  if (
    !title ||
    !authors ||
    !Array.isArray(authors) ||
    authors.length === 0 ||
    !year ||
    !type ||
    !number
  ) {
    return res
      .status(400)
      .json({ message: "Title, Authors (as array), Year, Type, and Number are required." });
  }
  if (!["journal", "conference"].includes(type)) {
    return res.status(400).json({ message: "Invalid publication type." });
  }

  const publication = new Publication({
    title,
    number,
    authors,
    venue,
    year,
    doi,
    link,
    abstract,
    type,
    image,
    location,
  });

  try {
    const newPublication = await publication.save();
    res.status(201).json(newPublication);
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({
        message: "Error: A publication with similar unique identifiers might already exist.",
        error: err.keyValue,
      });
    } else {
      res.status(400).json({ message: "Error creating publication: " + err.message });
    }
  }
});

// GET Publication by ID (Public or Admin)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid publication ID format." });
    }
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Cannot find publication" });
    }
    res.json(publication);
  } catch (err) {
    res.status(500).json({ message: "Error fetching publication: " + err.message });
  }
});

// PUT Update Publication by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid publication ID format." });
    }
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Cannot find publication" });
    }

    const oldImageUrl = publication.image;
    const newImageUrl = req.body.image;
    const { supabaseBucketName } = require("../config");
    const updates = req.body;

    // Validate required fields if they are being updated
    if (updates.hasOwnProperty("title") && updates.title === "") {
      return res.status(400).json({ message: "Title cannot be empty." });
    }
    if (updates.hasOwnProperty("number") && updates.number === "") {
      return res.status(400).json({ message: "Number cannot be empty." });
    }
    if (
      updates.hasOwnProperty("authors") &&
      (!Array.isArray(updates.authors) || updates.authors.length === 0)
    ) {
      return res.status(400).json({ message: "Authors must be a non-empty array." });
    }
    if (
      updates.hasOwnProperty("year") &&
      (updates.year === "" || (updates.year && isNaN(parseInt(updates.year, 10))))
    ) {
      return res.status(400).json({ message: "Year must be a valid number." });
    }
    if (
      updates.hasOwnProperty("type") &&
      updates.type &&
      !["journal", "conference"].includes(updates.type)
    ) {
      return res.status(400).json({ message: "Invalid publication type." });
    }

    // Update fields provided in the request body
    Object.keys(updates).forEach((key) => {
      // Check if the key is a path in the schema before attempting to assign
      if (publication.schema.path(key) && updates[key] !== undefined) {
        // Corrected line
        if (
          ["venue", "doi", "link", "abstract", "image", "location"].includes(key) &&
          updates[key] === ""
        ) {
          publication[key] = undefined; // Set to undefined to remove if it's an optional field and an empty string is passed
        } else {
          publication[key] = updates[key];
        }
      } else if (key === "_id" || key === "createdAt" || key === "updatedAt") {
        // Do nothing for protected fields, let Mongoose handle them
      } else if (updates[key] !== undefined) {
        // If the key is not in schema but present in updates (and not undefined),
        // it might be an attempt to add an arbitrary field.
        // For strict schemas, this won't be saved. For non-strict, it might.
        // It's often better to ignore such fields or log a warning.
        // console.warn(`Attempted to update non-schema field: ${key}`);
      }
    });

    // Handle image deletion from Supabase if URL changes
    if (newImageUrl !== oldImageUrl && oldImageUrl) {
      const filenameToDelete = extractFilenameFromUrl(oldImageUrl);
      if (filenameToDelete && supabaseBucketName) {
        console.log(
          `Attempting to delete old image: ${filenameToDelete} from bucket: ${supabaseBucketName}`
        );
        const { error: deleteError } = await supabase.storage
          .from(supabaseBucketName)
          .remove([filenameToDelete]);
        if (deleteError) {
          console.error("Error deleting old image from Supabase:", deleteError.message);
          // Potentially log this but don't necessarily halt the DB update
        } else {
          console.log(`Successfully deleted old image: ${filenameToDelete}`);
        }
      }
    }
    // Explicitly set image field based on request (handles setting to null/undefined to clear image)
    // This ensures that if `updates.image` was null or empty string (and handled above), it's correctly set.
    if (updates.hasOwnProperty("image")) {
      publication.image =
        updates.image === "" || updates.image === null ? undefined : updates.image;
    }

    const updatedPublication = await publication.save();
    res.json(updatedPublication);
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({
        message:
          "Update failed: A publication with similar unique identifiers might already exist.",
        error: err.keyValue,
      });
    } else {
      console.error("Full error during update:", err); // Log the full error for more details
      res.status(500).json({ message: "Error updating publication: " + err.message });
    }
  }
});

// DELETE Publication by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid publication ID format." });
    }
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Cannot find publication" });
    }

    const imageUrlToDelete = publication.image;

    if (imageUrlToDelete) {
      const filenameToDelete = extractFilenameFromUrl(imageUrlToDelete);
      if (filenameToDelete && supabaseBucketName) {
        console.log(
          `Attempting to delete image: ${filenameToDelete} from bucket: ${supabaseBucketName}`
        );
        const { error } = await supabase.storage
          .from(supabaseBucketName)
          .remove([filenameToDelete]);
        if (error) {
          console.error(
            "Error deleting image from Supabase during publication deletion:",
            error.message
          );
        } else {
          console.log(`Successfully deleted image: ${filenameToDelete}`);
        }
      }
    }

    await publication.deleteOne();
    res.json({ message: "Deleted publication" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting publication: " + err.message });
  }
});

module.exports = router;
