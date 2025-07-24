const AboutPageContent = require("../models/about");

// @desc    Create new About Page Content (a track)
// @route   POST /api/about
// @access  Public (adjust as needed, e.g., add authentication middleware)
exports.createAboutContent = async (req, res) => {
  try {
    const { title, content } = req.body;

    const newContent = await AboutPageContent.create({ title, content });
    res.status(201).json({
      success: true,
      data: newContent,
    });
  } catch (error) {
    console.error("Error creating about content:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: "Server Error: Could not create about content.",
      error: error.message,
    });
  }
};

// @desc    Get all About Page Content (all tracks)
// @route   GET /api/about
// @access  Public
exports.getAllAboutContent = async (req, res) => {
  try {
    const allContent = await AboutPageContent.find({});
    res.status(200).json({
      success: true,
      data: allContent,
    });
  } catch (error) {
    console.error("Error fetching all about content:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch about content.",
      error: error.message,
    });
  }
};

// @desc    Get single About Page Content (a track) by ID
// @route   GET /api/about/:id
// @access  Public
exports.getAboutContentById = async (req, res) => {
  try {
    const content = await AboutPageContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, message: "About content not found." });
    }
    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("Error fetching about content by ID:", error);
    if (error.name === "CastError") {
      // Mongoose CastError for invalid ID format
      return res.status(400).json({ success: false, message: "Invalid ID format." });
    }
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch about content.",
      error: error.message,
    });
  }
};

// @desc    Update About Page Content (a track) by ID
// @route   PUT /api/about/:id
// @access  Public (adjust as needed)
exports.updateAboutContent = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (content) {
      for (const block of content) {
        if (!block.title || !block.text || !block.img) {
          return res.status(400).json({
            success: false,
            message: "Each content block must have a title, text, and img.",
          });
        }
      }
    }

    const updatedContent = await AboutPageContent.findByIdAndUpdate(
      req.params.id,
      req.body, // { title, content }
      {
        new: true, // Return the modified document rather than the original
        runValidators: true, // Ensure schema validations are run on update
      }
    );

    if (!updatedContent) {
      return res
        .status(404)
        .json({ success: false, message: "About content not found to update." });
    }
    res.status(200).json({
      success: true,
      data: updatedContent,
    });
  } catch (error) {
    console.error("Error updating about content:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid ID format." });
    }
    res.status(500).json({
      success: false,
      message: "Server Error: Could not update about content.",
      error: error.message,
    });
  }
};

// @desc    Delete About Page Content (a track) by ID
// @route   DELETE /api/about/:id
// @access  Public (adjust as needed)
exports.deleteAboutContent = async (req, res) => {
  try {
    const content = await AboutPageContent.findByIdAndDelete(req.params.id);
    if (!content) {
      return res
        .status(404)
        .json({ success: false, message: "About content not found to delete." });
    }
    res.status(200).json({
      // Or 204 No Content if you prefer
      success: true,
      message: "About content deleted successfully.",
      data: {}, // Or simply omit data for 204
    });
  } catch (error) {
    console.error("Error deleting about content:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid ID format." });
    }
    res.status(500).json({
      success: false,
      message: "Server Error: Could not delete about content.",
      error: error.message,
    });
  }
};
