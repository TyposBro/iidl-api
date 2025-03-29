const mongoose = require("mongoose");

const backgroundItemSchema = new mongoose.Schema({
  period: String,
  desc: String,
});

const backgroundSchema = new mongoose.Schema({
  type: String,
  items: [backgroundItemSchema],
});

const professorSchema = new mongoose.Schema({
  img: String,
  name: String,
  role: String,
  desc: String,
  stats: [{ key: String, value: Number }],
  interests: String,
  background: [backgroundSchema],
});

const Professor = mongoose.model("Professor", professorSchema);

module.exports = Professor;
