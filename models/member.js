const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  img: String,
  name: String,
  role: String,
  bio: String,
  status: {
    type: String,
    enum: ["current", "alumni"], // Add a status field to differentiate
    required: true,
  },
});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
