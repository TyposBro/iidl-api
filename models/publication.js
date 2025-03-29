const mongoose = require("mongoose");

const publicationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  authors: {
    type: [String],
    required: true,
  },
  journal: {
    type: String,
  },
  year: {
    type: Number,
  },
  doi: {
    type: String,
  },
  link: {
    type: String,
  },
  abstract: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Publication = mongoose.model("Publication", publicationSchema);

module.exports = Publication;
