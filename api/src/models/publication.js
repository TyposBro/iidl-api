// models/publication.js
const mongoose = require("mongoose");

const publicationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Publication title is required"],
    },
    authors: {
      type: [String], // Keep as array
      required: [true, "Authors are required"],
    },
    // Rename 'journal' to 'venue' for more generality (optional but recommended)
    venue: {
      // Can be Journal name or Conference name
      type: String,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      index: true,
    },
    doi: {
      type: String,
    },
    link: {
      type: String, // URL link
    },
    abstract: {
      type: String,
    },
    // --- New Fields ---
    type: {
      // To distinguish publication types
      type: String,
      required: [true, "Publication type is required"],
      enum: ["journal", "conference"],
      index: true,
    },
    image: {
      // Optional representative image URL
      type: String,
    },
    // --- Timestamps ---
  },
  { timestamps: true }
); // Use mongoose timestamps for createdAt/updatedAt

// Remove manual timestamps if using mongoose timestamps: true
// createdAt: {
//   type: Date,
//   default: Date.now,
// },
// updatedAt: {
//   type: Date,
//   default: Date.now,
// },

const Publication = mongoose.model("Publication", publicationSchema);

module.exports = Publication;
