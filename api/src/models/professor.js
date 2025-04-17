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
