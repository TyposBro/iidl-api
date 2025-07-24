// {PATH_TO_THE_PROJECT}/src/models/project.js
// This file defines a Mongoose schema and model for projects.
// It includes fields for title, subtitle, description, image, link, status, year,
// authors, awardName, and tags.
// It also includes timestamps for createdAt and updatedAt.
//
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
    },
    number: {
      type: Number,
      required: [true, "Project number is required"],
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
    authors: { type: [String] },
    tags: { type: [String] },
    awardName: {
      // Specific name of the award (e.g., "Reddot Design Award")
      type: String,
    },
  },
  { timestamps: true }
); // Adds createdAt and updatedAt automatically

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
