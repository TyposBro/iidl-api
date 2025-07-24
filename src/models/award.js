// {PATH_TO_THE_PROJECT}/src/models/award.js
// Model for the Awards page

const mongoose = require("mongoose");

const awardSchema = new mongoose.Schema({
  title: String,
  year: Number,
  img: String,
  authors: String,
  number: {
    type: Number,
    required: [true, "Award number is required"],
  },
});

const Award = mongoose.model("Award", awardSchema);

module.exports = Award;
