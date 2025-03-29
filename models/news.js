const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  title: String,
  text: String,
  date: String,
  images: [String],
  type: String,
});

const News = mongoose.model("News", newsSchema);

module.exports = News;
