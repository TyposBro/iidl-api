// {PATH_TO_THE_PROJECT}/api/src/models/about.js
const mongoose = require("mongoose");

// Define the main About page schema
const meta = new mongoose.Schema(
  {
    page: {
      type: String,
      required: [true, "page is required."],
      trim: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Create and export the model
const Meta = mongoose.model("Meta", meta);
module.exports = Meta;
