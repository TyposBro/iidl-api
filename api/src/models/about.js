// {PATH_TO_THE_PROJECT}/api/src/models/about.js
// Model for the About page
const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
  intro: {
    slides: [String], // Array of image URLs for the carousel
    heading: String,
    description: String,
  },
  tracks: {
    title: String,
    buttons: [String], // List of research track titles
  },
  details: [
    {
      title: String,
      description: String,
      image: String, // Image URL for background images
    },
  ],
});

const AboutPage = mongoose.model("AboutPage", aboutSchema);
module.exports = AboutPage;
