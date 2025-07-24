// {PATH_TO_THE_PROJECT}/api/src/routes/team.js
// This file contains the API routes for managing team members.
// It includes routes for creating, reading, updating, and deleting team members.
// It also includes middleware for authentication and authorization.
// It uses Supabase for image storage and retrieval.
// It uses Mongoose for MongoDB interactions.
//

const express = require("express");
const router = express.Router();
const TeamMember = require("../models/team");
const authenticateAdmin = require("../middleware/auth");
const supabase = require("../supabaseClient");
const { supabaseBucketName } = require("../config");

// Function to extract filename from URL (same as in gallery routes)
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

// --- API Endpoints for Team Members ---

// GET All Team Members (Public)
router.get("/", async (req, res) => {
  try {
    const teamMembers = await TeamMember.find().sort({ number: 1 });
    console.log("Fetched team members:", teamMembers); // Debugging log
    res.json(teamMembers); // Sort by number field
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create New Team Member (Admin Only)
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const teamMember = new TeamMember({
      name: req.body.name,
      role: req.body.role,
      number: req.body.number, // Expecting a number field in the body
      img: req.body.img, // Expecting image URL in the body
      type: req.body.type,
      bio: req.body.bio,
      linkedIn: req.body.linkedIn,
    });

    const newTeamMember = await teamMember.save();
    res.status(201).json(newTeamMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET Team Member by ID (Public - Optional, if needed)
router.get("/:id", async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ message: "Cannot find team member" });
    }
    res.json(teamMember);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Update Team Member by ID (Admin Only)
router.put("/:id", authenticateAdmin, async (req, res) => {
  console.log("Updating team member with ID:", req); // Debugging log
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ message: "Cannot find team member" });
    }

    if (req.body.name !== undefined) teamMember.name = req.body.name;
    if (req.body.number !== undefined) teamMember.number = req.body.number;
    if (req.body.role !== undefined) teamMember.role = req.body.role;
    if (req.body.type !== undefined) teamMember.type = req.body.type;
    if (req.body.bio !== undefined) teamMember.bio = req.body.bio;
    if (req.body.linkedIn !== undefined) teamMember.linkedIn = req.body.linkedIn;

    // Handle image update
    if (req.body.img && req.body.img !== teamMember.img) {
      // Delete the old image from Supabase if the URL has changed and is not empty
      if (teamMember.img) {
        const filename = extractFilenameFromUrl(teamMember.img);
        if (filename) {
          const { error } = await supabase.storage.from(supabaseBucketName).remove([filename]);
          if (error) {
            console.error("Error deleting old image:", error);
          }
        }
      }
      teamMember.img = req.body.img;
    }

    const updatedTeamMember = await teamMember.save();
    res.json(updatedTeamMember);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Team Member by ID (Admin Only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ message: "Cannot find team member" });
    }

    // Delete the associated image from Supabase
    if (teamMember.img) {
      const filename = extractFilenameFromUrl(teamMember.img);
      if (filename) {
        const { error } = await supabase.storage.from(supabaseBucketName).remove([filename]);
        if (error) {
          console.error("Error deleting team member image:", error);
        }
      }
    }

    await teamMember.deleteOne();
    res.json({ message: "Deleted team member" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
