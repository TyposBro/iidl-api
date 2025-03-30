// models/project.js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
    },
    subtitle: {
      // Short description or subtitle
      type: String,
    },
    description: {
      // Longer description for details page or card expansion
      type: String,
    },
    image: {
      // URL of the main project image
      type: String,
    },
    link: {
      // Optional external link for the project
      type: String,
    },
    status: {
      // To categorize projects
      type: String,
      required: [true, "Project status is required"],
      enum: ["current", "completed", "award"], // Defines allowed values
      index: true, // Add index for faster querying by status
    },
    year: {
      // Relevant for completed projects and awards
      type: Number,
    },
    authors: {
      // Relevant for awards or publications associated with projects
      type: String, // Could be a comma-separated string or an Array of Strings
    },
    awardName: {
      // Specific name of the award (e.g., "Reddot Design Award")
      type: String,
    },
    tags: [String], // For filtering or categorization
    // Optional: Add start/end dates if needed for current/completed projects
    // startDate: Date,
    // endDate: Date,
  },
  { timestamps: true }
); // Adds createdAt and updatedAt automatically

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
