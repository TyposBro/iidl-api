const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["current", "alumni"],
  },
  bio: {
    // Added bio field
    type: String,
  },
});

const TeamMember = mongoose.model("TeamMember", teamSchema);

module.exports = TeamMember;
