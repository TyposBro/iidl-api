require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Import Routes
const professorRoutes = require("./routes/professor");
const taskRoutes = require("./routes/tasks");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/projects");
const publicationRoutes = require("./routes/publications");
const newsRoutes = require("./routes/news");
const galleryRoutes = require("./routes/gallery"); // Import the new gallery routes

// Use Routes as Middleware
app.use("/api/professor", professorRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/gallery", galleryRoutes); // Use the new gallery routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
