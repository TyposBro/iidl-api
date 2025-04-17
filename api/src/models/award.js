const mongoose = require("mongoose");

const awardSchema = new mongoose.Schema({
  title: String,
  year: Number,
  img: String,
  authors: String,
});

const Award = mongoose.model("Award", awardSchema);

module.exports = Award;
