// {PATH_TO_THE_PROJECT}/src/utils/gridfsUploadHandler.js
// Handles processing after files have been uploaded to GridFS by multer middleware.

// const crypto = require('crypto'); // Only needed if implementing checksum deduplication here

const handleGridfsUpload = async (req, res) => {
  // This logic executes *after* multer-gridfs-storage has saved the files.
  // req.files contains the details of the files stored in GridFS.

  if (!req.files || req.files.length === 0) {
    // This check might be redundant if multer throws an error, but good practice.
    return res.status(400).json({ message: "No files were uploaded or processed by middleware." });
  }

  try {
    // Map the file details provided by multer-gridfs-storage to the URLs
    // that point to our file serving endpoint.
    const uploadedImageUrls = req.files
      .map((file) => {
        // The 'file' object here comes from multer-gridfs-storage
        // and should contain the 'id' of the stored GridFS file.
        if (!file || !file.id) {
          console.error(
            "Middleware (multer-gridfs-storage) did not return file ID for:",
            file?.originalname || "unknown file"
          );
          // Skip this file or return an error marker
          return null;
        }
        // Construct the relative URL using the file ID
        return `/images/${file.id.toString()}`;
      })
      .filter((url) => url !== null); // Filter out any entries where an ID was missing

    if (uploadedImageUrls.length === 0 && req.files.length > 0) {
      // This case means files were received, but processing failed for all of them
      // (e.g., middleware didn't add IDs correctly)
      return res.status(500).json({ message: "Failed to process any uploaded files." });
    }

    console.log("Files processed by GridFS handler, URLs:", uploadedImageUrls);
    // Send the array of URLs back to the client
    return res.status(200).json(uploadedImageUrls);
  } catch (error) {
    console.error("Error processing GridFS upload results:", error);
    // Avoid sending another response if headers might have been sent (unlikely here)
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error processing upload results." });
    }
  }
};

module.exports = handleGridfsUpload;
