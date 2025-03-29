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
});

const TeamMember = mongoose.model("TeamMember", teamSchema);

module.exports = TeamMember;
