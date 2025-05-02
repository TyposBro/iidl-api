// {PATH_TO_THE_PROJECT}/api/src/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const crypto = require("crypto");

const professorRoutes = require("./routes/professor");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/project");
const publicationRoutes = require("./routes/publication");
const newsRoutes = require("./routes/news");
const galleryRoutes = require("./routes/gallery");
const authRoutes = require("./routes/auth");
const aboutRoutes = require("./routes/about");

const supabase = require("./supabaseClient"); // Import Supabase client
const handleImageUpload = require("./utils/uploadHandler");

const app = express();
const port = process.env.API_PORT || 8000;

app.use(cors());
app.use(express.json());

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MongoDB Connection
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri)
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch((err) => console.log(err));

app.post("/api/upload", upload.array("images", 10), async (req, res) => {
  await handleImageUpload(req, res, supabase);
});

// API Routes
app.use("/api/professors", professorRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/about", aboutRoutes);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
