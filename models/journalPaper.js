const mongoose = require("mongoose");

const journalPaperSchema = new mongoose.Schema({
  title: String,
  publisher: String,
  year: Number,
  authors: [String],
  link: String,
});

const JournalPaper = mongoose.model("JournalPaper", journalPaperSchema);

module.exports = JournalPaper;
