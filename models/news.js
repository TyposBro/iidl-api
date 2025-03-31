const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  images: [String],
  content: { type: String, required: true },
  type: { type: String, required: true },
});

const News = mongoose.model("News", newsSchema);

module.exports = News;
