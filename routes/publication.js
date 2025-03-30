// routes/publications.js
const express = require("express");
const router = express.Router();
const Publication = require("../models/publication"); // Adjust path if needed
const authenticateAdmin = require("../middleware/auth"); // Adjust path if needed
const supabase = require("../supabaseClient"); // Adjust path if needed

// Helper function to extract filename from Supabase URL (ensure this is accessible)
const extractFilenameFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    const pathSegments = urlObject.pathname.split("/");
    const bucketName = process.env.SUPABASE_BUCKET_NAME;
    const bucketIndex = pathSegments.findIndex((segment) => segment === bucketName);
    if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
      return decodeURIComponent(pathSegments.slice(bucketIndex + 1).join("/")); // Decode URI component potentially encoded filename
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
  // Make admin only? Or keep public? Assuming admin for list view.
  try {
    const publications = await Publication.find().sort({ type: 1, year: -1, createdAt: -1 }); // Sort by type, then year
    res.json(publications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching publications: " + err.message });
  }
});

// GET Publications by Type (Public) - Replaces old /:listType approach
router.get("/type/:type", async (req, res) => {
  const validType = ["journal", "conference"];
  const type = req.params.type?.toLowerCase(); // Normalize to lowercase

  if (!validType.includes(type)) {
    return res.status(400).json({ message: "Invalid publication type specified." });
  }

  try {
    const publications = await Publication.find({ type: type }).sort({ year: -1, createdAt: -1 });
    res.json(publications);
  } catch (err) {
    res.status(500).json({ message: `Error fetching ${type} publications: ${err.message}` });
  }
});

// POST Create New Publication (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  const {
    title,
    authors, // Expecting an array from frontend
    venue, // Changed from journal
    year,
    doi,
    link,
    abstract,
    type, // Added type
    image, // Added image URL from upload
  } = req.body;

  // Basic Validation
  if (!title || !authors || !Array.isArray(authors) || authors.length === 0 || !year || !type) {
    return res
      .status(400)
      .json({ message: "Title, Authors (as array), Year, and Type are required." });
  }
  if (!["journal", "conference"].includes(type)) {
    return res.status(400).json({ message: "Invalid publication type." });
  }

  const publication = new Publication({
    title,
    authors,
    venue,
    year,
    doi,
    link,
    abstract,
    type,
    image,
  });

  try {
    const newPublication = await publication.save();
    res.status(201).json(newPublication);
  } catch (err) {
    // Check for duplicate key errors if you have unique indexes (e.g., on DOI)
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

// GET Publication by ID (Public or Admin) - Keep as is for potential detail view
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
    const newImageUrl = req.body.image; // Can be new URL, old URL, null, or undefined
    const bucketName = process.env.SUPABASE_BUCKET_NAME;
    const updates = req.body;

    // Validate required fields if they are being updated
    if (updates.title === "") return res.status(400).json({ message: "Title cannot be empty." });
    if (updates.authors && (!Array.isArray(updates.authors) || updates.authors.length === 0)) {
      return res.status(400).json({ message: "Authors must be a non-empty array." });
    }
    if (updates.year === "" || (updates.year && isNaN(parseInt(updates.year, 10)))) {
      return res.status(400).json({ message: "Year must be a valid number." });
    }
    if (updates.type && !["journal", "conference"].includes(updates.type)) {
      return res.status(400).json({ message: "Invalid publication type." });
    }

    // Update fields provided in the request body
    // Use Object.assign or spread operator for cleaner updates
    Object.keys(updates).forEach((key) => {
      // Only update fields that exist in the schema and are part of the request
      if (publicationSchema.path(key) && updates[key] !== undefined) {
        // Handle potential empty strings for optional fields by setting to undefined
        if (["venue", "doi", "link", "abstract", "image"].includes(key) && updates[key] === "") {
          publication[key] = undefined;
        } else {
          publication[key] = updates[key];
        }
      }
    });

    // Handle image deletion from Supabase if URL changes
    let imageDeleted = false;
    if (newImageUrl !== oldImageUrl && oldImageUrl) {
      // If image changed AND there was an old one
      const filenameToDelete = extractFilenameFromUrl(oldImageUrl);
      if (filenameToDelete && bucketName) {
        console.log(
          `Attempting to delete old image: ${filenameToDelete} from bucket: ${bucketName}`
        );
        const { error } = await supabase.storage.from(bucketName).remove([filenameToDelete]);
        if (error) {
          console.error("Error deleting old image from Supabase:", error.message);
          // Decide if this should halt the update; maybe not if file non-existence is the error
        } else {
          console.log(`Successfully deleted old image: ${filenameToDelete}`);
          imageDeleted = true;
        }
      }
    }
    // Explicitly set image field based on request (handles setting to null/undefined)
    publication.image = newImageUrl === null ? undefined : newImageUrl;

    // Mongoose `timestamps: true` handles `updatedAt` automatically on `save()`
    // publication.updatedAt = Date.now();

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
    const bucketName = process.env.SUPABASE_BUCKET_NAME;

    // Delete associated image from Supabase first
    if (imageUrlToDelete) {
      const filenameToDelete = extractFilenameFromUrl(imageUrlToDelete);
      if (filenameToDelete && bucketName) {
        console.log(`Attempting to delete image: ${filenameToDelete} from bucket: ${bucketName}`);
        const { error } = await supabase.storage.from(bucketName).remove([filenameToDelete]);
        if (error) {
          console.error(
            "Error deleting image from Supabase during publication deletion:",
            error.message
          );
          // Proceed with DB deletion even if image deletion fails? Log it.
        } else {
          console.log(`Successfully deleted image: ${filenameToDelete}`);
        }
      }
    }

    // Use deleteOne() method on the document instance
    await publication.deleteOne();
    // Or use the static method: await Publication.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted publication" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting publication: " + err.message });
  }
});

module.exports = router;
