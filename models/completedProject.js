const mongoose = require("mongoose");

const completedProjectSchema = new mongoose.Schema({
  title: String,
  desc: String,
  year: String,
  img: String,
});

const CompletedProject = mongoose.model("CompletedProject", completedProjectSchema);

module.exports = CompletedProject;
