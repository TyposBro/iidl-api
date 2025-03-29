const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  title: String,
  year: Number,
  location: String,
  images: [String],
  type: String,
});

const GalleryEvent = mongoose.model("GalleryEvent", gallerySchema);

module.exports = GalleryEvent;
