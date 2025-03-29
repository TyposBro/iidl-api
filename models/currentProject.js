const mongoose = require("mongoose");

const currentProjectSchema = new mongoose.Schema({
  img: String,
  title: String,
  subtitle: String,
  desc: String,
  action: String, // You have 'action' in the Card component, so including it here
});

const CurrentProject = mongoose.model("CurrentProject", currentProjectSchema);

module.exports = CurrentProject;
