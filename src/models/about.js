// {PATH_TO_THE_PROJECT}/api/src/models/about.js
const mongoose = require("mongoose");

// Schema for content blocks within a track
const contentBlockSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
    },
    text: {
      type: String,
      required: [true, "Text is required."],
      trim: true,
    },
    img: {
      type: String,
      required: [true, "Image is required."], // Assuming this is a URL or path
      trim: true,
    },
  },
  { _id: true }
);

// Schema for an individual research track
const trackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Track title is required."],
      trim: true,
    },
    content: {
      type: [contentBlockSchema],
      validate: [
        // Custom validator to ensure array is not empty
        (val) => val.length > 0,
        "At least one content block is required.",
      ],
      required: [true, "Content blocks are required."],
    },
  },
  { _id: true, timestamps: true } // Added timestamps for createdAt and updatedAt
);

const AboutPageContent = mongoose.model("AboutPageContent", trackSchema);
module.exports = AboutPageContent;
