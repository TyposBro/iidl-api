const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

// Ensure the controller path is correct.
// Assuming your controllers are in a 'controllers' directory and the file is 'aboutController.js'
// If it's just 'about.js' as per your original snippet, then '../controllers/about' is fine.
const {
  createAboutContent,
  getAllAboutContent,
  getAboutContentById,
  updateAboutContent,
  deleteAboutContent,
} = require("../controllers/about"); // Or ../controllers/about if that's your filename

// --- Public Routes (No authentication needed) ---

// GET all content - Public
router.get("/", getAllAboutContent);

// GET content by ID - Public
router.get("/:id", getAboutContentById);

// --- Admin Protected Routes (Requires token and admin role) ---

// POST create new content - Admin only
router.post("/", verifyToken, createAboutContent);

// PUT update content by ID - Admin only
router.put("/:id", verifyToken, updateAboutContent);

// DELETE content by ID - Admin only
router.delete("/:id", verifyToken, deleteAboutContent);

module.exports = router;
