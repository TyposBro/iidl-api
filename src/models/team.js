// {PATH_TO_THE_PROJECT}/src/models/team.js
// This file defines a Mongoose schema and model for team members.
// It includes fields for name, role, image, type (current or alumni), and an optional bio.
// It uses Mongoose to create a model named "TeamMember" based on the schema.
// It exports the model for use in other parts of the application.
//

const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  number: {
    type: Number,
    required: [true, "Number is required"],
  },
  role: {
    type: String,
    required: [true, "Role is required"],
  },
  img: {
    type: String,
    required: [true, "Image URL is required"],
  },
  type: {
    type: String,
    required: [true, "Type is required"],
    enum: ["current", "alumni"],
  },
  bio: {
    type: String,
  },
  linkedIn: {
    type: String,
  },
});

const TeamMember = mongoose.model("TeamMember", teamSchema);

module.exports = TeamMember;
