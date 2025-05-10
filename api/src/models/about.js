// {PATH_TO_THE_PROJECT}/api/src/models/about.js
const mongoose = require("mongoose");

// Define the schema for items within the body.list array foo
const bodyListItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Track title is required."],
    },
    text: {
      type: [String], // Array of strings (paragraphs)
      required: [true, "Track text description is required."],
    },
    img: {
      type: [String], // Array of image URLs for the track
      // Not strictly required, can be empty
    },
  },
  { _id: false }
); // Don't generate automatic _id for subdocuments in the array

// Define the main About page schema
const aboutSchema = new mongoose.Schema(
  {
    head: {
      title: {
        type: String,
        required: [true, "Head title is required."],
        trim: true,
      },
      description: {
        type: String,
        required: [true, "Head description is required."],
        trim: true,
      },
    },
    body: {
      title: {
        type: String,
        required: [true, "Body title is required."],
        trim: true,
      },
      list: {
        type: [bodyListItemSchema], // Array of items following the sub-schema
        default: [], // Default to an empty list
      },
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Create and export the model
const AboutPage = mongoose.model("AboutPage", aboutSchema);
module.exports = AboutPage;
