// {PATH_TO_THE_PROJECT}/api/src/scripts/createAdmin.js
// This script creates an admin user in the MongoDB database.
// It connects to the database, checks if an admin user already exists,
// and if not, creates a new admin user with a specified username and password.
// It uses Mongoose for database operations and bcrypt for password hashing.
// It also uses environment variables to store sensitive information like the database URI and admin credentials.
// It exports the createAdminUser function for use in other parts of the application.
//

const mongoose = require("mongoose");
const Admin = require("../models/admin"); // Adjust path if needed
const { uri, username, password } = require("../config"); // Adjust path if needed
require("dotenv").config(); // Load environment variables

async function createAdminUser() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`Admin user with username "${username}" already exists.`);
      mongoose.connection.close();
      return;
    }

    const newAdmin = new Admin({
      username,
      password: password,
    });

    await newAdmin.save();
    console.log(`Admin user "${username}" created successfully.`);
    console.log(`Admin password "${password}" created successfully.`);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error creating admin user:", error);
    mongoose.connection.close();
  }
}

createAdminUser();
