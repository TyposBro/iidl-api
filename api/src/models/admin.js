// {PATH_TO_THE_PROJECT}/api/src/models/admin.js
// Model for the Admin user
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Hash the password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const res = await bcrypt.compare(candidatePassword, this.password);
    return res;
  } catch (error) {
    throw new Error(error);
  }
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
