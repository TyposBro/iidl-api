// {PATH_TO_THE_PROJECT}/src/models/gallery.js
// This file defines a Mongoose schema and model for a gallery event.
// It includes fields for title, date, location, images, and type.

const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: String,
  images: [String],
  type: String,
});

const GalleryEvent = mongoose.model("GalleryEvent", gallerySchema);

module.exports = GalleryEvent;
