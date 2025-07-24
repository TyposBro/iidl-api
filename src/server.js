// {PATH_TO_THE_PROJECT}/src/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const crypto = require("crypto");
const { uri, port } = require("./config"); // Import MongoDB URI from config

const professorRoutes = require("./routes/professor");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/project");
const publicationRoutes = require("./routes/publication");
const newsRoutes = require("./routes/news");
const galleryRoutes = require("./routes/gallery");
const authRoutes = require("./routes/auth");
const aboutRoutes = require("./routes/about");
const metaRoutes = require("./routes/meta");
const supabase = require("./supabaseClient"); // Import Supabase client
const handleImageUpload = require("./utils/uploadHandler");

const app = express();

app.use(cors());
app.use(express.json());

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MongoDB Connection
mongoose
  .connect(uri)
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch((err) => console.log(err));

app.post("/upload", upload.array("images", 10), async (req, res) => {
  await handleImageUpload(req, res, supabase);
});

// API Routes
app.use("/prof", professorRoutes);
app.use("/team", teamRoutes);
app.use("/projects", projectRoutes);
app.use("/publications", publicationRoutes);
app.use("/news", newsRoutes);
app.use("/gallery", galleryRoutes);
app.use("/auth", authRoutes);
app.use("/about", aboutRoutes);
app.use("/meta", metaRoutes);

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
