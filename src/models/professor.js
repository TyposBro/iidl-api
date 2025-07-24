// {PATH_TO_THE_PROJECT}/src/models/professor.js
// This file defines a Mongoose schema and model for professors.
// It includes fields for name, role, image, description, CV link, email, phone,
// statistics, interests, and background.
// It also includes a nested schema for background items, which includes period and description.
//

const mongoose = require("mongoose");

const professorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: String,
  img: String,
  desc: String,
  cvLink: String,
  email: String,
  phone: String,
  stats: [
    {
      key: String,
      value: Number,
    },
  ],
  interests: String,
  background: [
    {
      type: { type: String, required: true },
      items: [
        {
          period: String,
          desc: String,
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Professor", professorSchema);
