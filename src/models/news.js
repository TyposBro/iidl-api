// {PATH_TO_THE_PROJECT}/src/models/news.js
// This file defines a Mongoose schema and model for news articles.
// It includes fields for title, date, images, content, and type.

const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  number: { type: Number, required: true }, // Added number field
  date: { type: String, required: true },
  images: [String],
  content: { type: String, required: true },
  type: { type: String, required: true },
});

const News = mongoose.model("News", newsSchema);

module.exports = News;
