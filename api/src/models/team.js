// {PATH_TO_THE_PROJECT}/api/src/models/team.js
// This file defines a Mongoose schema and model for team members.
// It includes fields for name, role, image, type (current or alumni), and an optional bio.
// It uses Mongoose to create a model named "TeamMember" based on the schema.
// It exports the model for use in other parts of the application.
//

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
