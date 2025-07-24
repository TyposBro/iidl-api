// {PATH_TO_THE_PROJECT}/api/src/routes/project.js
// This file defines the API routes for managing projects.
// It includes routes for getting all projects, getting projects by status,
// creating a new project, updating an existing project, and deleting a project.
// It uses Express.js for routing and Mongoose for database operations.
// It exports the router for use in other parts of the application.
// It also includes a helper function to extract filenames from Supabase URLs.
// It uses Supabase for file storage and retrieval.
// It includes authentication middleware for admin-only routes.
// It exports the router for use in other parts of the application.
// It includes error handling for various operations.
// It uses environment variables for configuration.
// It includes validation for required fields when creating or updating projects.
// It includes logging for important operations like file deletion.
// It includes sorting for project retrieval based on status.
// It includes a helper function to extract filenames from Supabase URLs.
// It uses Mongoose for database operations.
//

const express = require("express");
const router = express.Router();
const Project = require("../models/project"); // Adjust path if needed
const authenticateAdmin = require("../middleware/auth"); // Adjust path if needed
const supabase = require("../supabaseClient"); // Adjust path if needed
const { supabaseBucketName } = require("../config"); // Adjust path if needed

// Helper function to extract filename from Supabase URL
const extractFilenameFromUrl = (url) => {
  if (!url) return null;
  try {
    // Assuming Supabase public URL structure like:
    // https://<project-ref>.supabase.co/storage/v1/object/public/<bucket-name>/<filename>
    const urlObject = new URL(url);
    const pathSegments = urlObject.pathname.split("/");
    // Find the bucket name and return the part after it

    const bucketIndex = pathSegments.findIndex((segment) => segment === supabaseBucketName);
    if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
      // Join remaining segments in case filename contains '/' (though unlikely with default Supabase config)
      return pathSegments.slice(bucketIndex + 1).join("/");
    }
    return null; // Or handle different URL structures if necessary
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
};

// --- API Endpoints for Projects ---

// GET All Projects (Public - or could be admin only if needed)
// Useful for admin panel to list all projects regardless of status
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: "desc" }); // Or sort by year/status
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching projects: " + err.message });
  }
});

// GET Projects by Status (Public)
router.get("/status/:status", async (req, res) => {
  const validStatuses = ["current", "completed", "award"];
  const status = req.params.status;

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status parameter." });
  }

  try {
    let query = Project.find({ status: status });
    // Define default sort order for each status if needed
    if (status === "current") {
      query = query.sort({ createdAt: "desc" }); // Or a specific 'order' field
    } else if (status === "completed" || status === "award") {
      query = query.sort({ year: "desc", createdAt: "desc" });
    } else {
      query = query.sort({ createdAt: "desc" });
    }
    const projects = await query.exec();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: `Error fetching ${status} projects: ${err.message}` });
  }
});

// POST Create New Project (Admin Only)
// Image URL should come from a separate upload step (like in Gallery)
router.post("/", authenticateAdmin, async (req, res) => {
  const {
    title,
    subtitle,
    description,
    image, // URL from upload
    link,
    status,
    year,
    authors,
    awardName,
    tags,
  } = req.body;

  // Basic validation
  if (!title || !status) {
    return res.status(400).json({ message: "Title and status are required." });
  }
  if (status === "award" && (!year || !awardName)) {
    return res
      .status(400)
      .json({ message: "Year and Award Name are required for status 'award'." });
  }
  if (status === "completed" && !year) {
    return res.status(400).json({ message: "Year is required for status 'completed'." });
  }

  const project = new Project({
    title,
    subtitle,
    description,
    image,
    link,
    status,
    year,
    authors,
    awardName: status === "award" ? awardName : undefined, // Only save awardName if status is 'award'
    tags,
  });

  try {
    const newProject = await project.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: "Error creating project: " + err.message });
  }
});

// PUT Update Project by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Cannot find project" });
    }

    const oldImageUrl = project.image;
    const newImageUrl = req.body.image;

    // Update fields provided in the request body
    const updates = req.body;
    // Ensure status constraints are met if status is updated
    if (updates.status) {
      if (updates.status === "award" && !updates.year && !project.year) {
        return res
          .status(400)
          .json({ message: "Year is required when setting status to 'award'." });
      }
      if (updates.status === "completed" && !updates.year && !project.year) {
        return res
          .status(400)
          .json({ message: "Year is required when setting status to 'completed'." });
      }
      // Clear awardName if status is not 'award'
      if (updates.status !== "award") {
        updates.awardName = undefined;
      } else if (!updates.awardName && !project.awardName) {
        return res
          .status(400)
          .json({ message: "Award Name is required when setting status to 'award'." });
      }
    } else {
      // If status is not changing, but other fields are
      if (project.status === "award" && !updates.awardName && !project.awardName) {
        // Ensure awardName isn't accidentally removed if status remains 'award'
        updates.awardName = project.awardName; // Keep existing if not provided
      }
    }

    Object.keys(updates).forEach((key) => {
      // Update project field if it exists in the schema (preventing arbitrary fields)
      if (project.schema.path(key)) {
        project[key] = updates[key];
      }
    });

    // Handle image deletion from Supabase ONLY if a new image URL is provided
    // AND it's different from the old one
    if (newImageUrl && oldImageUrl && newImageUrl !== oldImageUrl) {
      const filenameToDelete = extractFilenameFromUrl(oldImageUrl);
      if (filenameToDelete && supabaseBucketName) {
        console.log(
          `Attempting to delete old image: ${filenameToDelete} from bucket: ${supabaseBucketName}`
        );
        const { error } = await supabase.storage
          .from(supabaseBucketName)
          .remove([filenameToDelete]);
        if (error) {
          // Log error but proceed with DB update - maybe the file was already deleted
          console.error("Error deleting old image from Supabase:", error.message);
        } else {
          console.log(`Successfully deleted old image: ${filenameToDelete}`);
        }
      } else {
        console.warn(
          `Could not delete old image. Filename: ${filenameToDelete}, Bucket: ${supabaseBucketName}`
        );
      }
    } else if (newImageUrl === null && oldImageUrl) {
      // If image is explicitly set to null (removed), delete the old one
      const filenameToDelete = extractFilenameFromUrl(oldImageUrl);
      if (filenameToDelete && supabaseBucketName) {
        const { error } = await supabase.storage
          .from(supabaseBucketName)
          .remove([filenameToDelete]);
        if (error) {
          console.error("Error deleting image from Supabase on removal:", error.message);
        } else {
          console.log(`Successfully deleted image on removal: ${filenameToDelete}`);
        }
        project.image = undefined; // Ensure it's cleared in the database
      }
    }

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: "Error updating project: " + err.message });
  }
});

// DELETE Project by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Cannot find project" });
    }

    const imageUrlToDelete = project.image;

    // Delete associated image from Supabase before deleting the DB record
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
          // Log error but proceed with DB deletion
          console.error(
            "Error deleting image from Supabase during project deletion:",
            error.message
          );
        } else {
          console.log(`Successfully deleted image: ${filenameToDelete}`);
        }
      } else {
        console.warn(
          `Could not delete image for project ${req.params.id}. Filename: ${filenameToDelete}, Bucket: ${supabaseBucketName}`
        );
      }
    }

    await project.deleteOne(); // Use deleteOne() on the document
    res.json({ message: "Deleted project" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting project: " + err.message });
  }
});

module.exports = router;
