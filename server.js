const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const professorRoutes = require("./routes/professor");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/project"); // Import project routes
const publicationRoutes = require("./routes/publication");
const newsRoutes = require("./routes/news");
const galleryRoutes = require("./routes/gallery");
const authRoutes = require("./routes/auth");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri)
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch((err) => console.log(err));

// API Routes
app.use("/api/professor", professorRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes); // Use project routes
app.use("/api/publications", publicationRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
