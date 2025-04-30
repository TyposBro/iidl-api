// {PATH_TO_THE_PROJECT}/api/src/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const crypto = require("crypto"); // Keep if used in storage config or elsewhere
const { GridFsStorage } = require("multer-gridfs-storage");
const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");

// --- Import Routes ---
const professorRoutes = require("./routes/professor");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/project");
const publicationRoutes = require("./routes/publication");
const newsRoutes = require("./routes/news");
const galleryRoutes = require("./routes/gallery");
const authRoutes = require("./routes/auth");
const aboutRoutes = require("./routes/about");
// --- End Import Routes ---

// --- Import GridFS Upload Handler ---
const handleGridfsUpload = require("./utils/gridfsUploadHandler"); // Adjust path if needed
// --- End Import Handler ---

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// --- MongoDB and GridFS Setup ---
const uri = process.env.MONGO_URI;
let db;
let bucket;

if (!uri) {
  console.error("Error: MONGODB_URI environment variable not set.");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connection established successfully (Mongoose)");
    db = mongoose.connection.client.db();
    bucket = new GridFSBucket(db, { bucketName: "uploads" });
    console.log("GridFS Bucket initialized.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// --- Multer GridFS Storage Engine (Setup remains in server.js) ---
const storage = new GridFsStorage({
  url: uri,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const cleanedOriginalname = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        const filename = `${buf.toString("hex")}-${Date.now()}-${cleanedOriginalname}`;
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
          metadata: {
            originalName: file.originalname,
            uploadDate: new Date(),
            // uploadedBy: req.user ? req.user.id : 'anonymous'
          },
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({
  storage: storage,
  // limits: { fileSize: 5 * 1024 * 1024 },
});
// --- End Multer GridFS Setup ---

// --- File Serving Endpoint (Remains in server.js) ---
app.get("/api/images/:fileId", async (req, res) => {
  // ... (Keep the existing GET logic here) ...
  if (!bucket) {
    // Wait briefly if bucket isn't initialized yet (simple retry mechanism)
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!bucket)
      return res.status(503).json({ message: "GridFS service temporarily unavailable." });
  }

  const fileId = req.params.fileId;

  // Validate if the provided ID is a valid MongoDB ObjectId
  if (!ObjectId.isValid(fileId)) {
    return res.status(400).json({ message: "Invalid File ID format." });
  }

  const _id = new ObjectId(fileId);

  try {
    // Find the file metadata
    const files = await bucket.find({ _id }).limit(1).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found." });
    }

    const file = files[0];

    // Set Headers
    res.set("Content-Type", file.contentType || "application/octet-stream");
    res.set("Content-Disposition", `inline; filename="${file.filename}"`);
    res.set("Content-Length", file.length);

    // Create readable stream from GridFS and pipe it to the response
    const downloadStream = bucket.openDownloadStream(_id);

    downloadStream.on("error", (err) => {
      console.error(`Error streaming file ${_id}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error retrieving file." });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error(`Error fetching file ${_id}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error retrieving file." });
    }
  }
});

// --- File Upload Endpoint (Uses middleware then delegates to handler) ---
app.post("/api/upload", upload.array("images", 10), async (req, res) => {
  // The 'upload.array' middleware runs first and saves files to GridFS.
  // Then, we pass control to our dedicated handler function.
  await handleGridfsUpload(req, res);
});

// --- Other API Routes ---
app.use("/api/professors", professorRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/about", aboutRoutes);
// --- End API Routes ---

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
// --- End Start Server ---
