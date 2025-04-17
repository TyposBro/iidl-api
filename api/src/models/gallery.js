const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
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
