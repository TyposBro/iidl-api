const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/admin"); // Adjust path if needed
require("dotenv").config(); // Load environment variables

const uri = process.env.MONGODB_URI;
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

async function createAdminUser() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`Admin user with username "${username}" already exists.`);
      mongoose.connection.close();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      username,
      password: hashedPassword,
    });

    await newAdmin.save();
    console.log(`Admin user "${username}" created successfully.`);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error creating admin user:", error);
    mongoose.connection.close();
  }
}

createAdminUser();
