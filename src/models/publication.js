// {PATH_TO_THE_PROJECT}/src/models/publication.js
// This file defines a Mongoose schema and model for publications.
// It includes fields for title, authors, venue, year, doi, link, abstract,
// type, image, and timestamps.
// It also includes validation for required fields and enumerations for type.
// It uses Mongoose to create a model named "Publication" based on the schema.
// It exports the model for use in other parts of the application.
//

const mongoose = require("mongoose");

const publicationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Publication title is required"],
    },
    number: {
      type: Number,
      required: [true, "Publication number is required"],
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
    location: {
      type: String,
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
