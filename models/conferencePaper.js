const mongoose = require("mongoose");

const conferencePaperSchema = new mongoose.Schema({
  title: String,
  authors: [String],
  year: Number,
  publisher: String,
  location: String,
  link: String,
});

const ConferencePaper = mongoose.model("ConferencePaper", conferencePaperSchema);

module.exports = ConferencePaper;
