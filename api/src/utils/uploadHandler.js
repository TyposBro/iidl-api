// utils/uploadHandler.js
const crypto = require("crypto");

const handleImageUpload = async (req, res, supabase) => {
  try {
    const bucketName = process.env.SUPABASE_BUCKET_NAME;
    const uploadedImageUrls = [];

    for (const file of req.files) {
      const buffer = file.buffer;
      const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
      const filename = `${checksum}`; // Use checksum as filename (or part of it)

      // Check if an image with the same checksum already exists
      const { data: existingFiles, error: listError } = await supabase.storage
        .from(bucketName)
        .list("", { search: checksum }); // Search for filename containing the checksum

      if (listError) {
        console.error("Error listing files in Supabase:", listError);
        return res.status(500).json({ message: "Error checking for existing images." });
      }

      if (existingFiles && existingFiles.length > 0) {
        // Duplicate found, get the public URL of the existing file
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(existingFiles[0].name);
        uploadedImageUrls.push(publicUrlData.publicUrl);
        console.log(
          `Duplicate image found (checksum: ${checksum}), using existing URL: ${publicUrlData.publicUrl}`
        );
      } else {
        // No duplicate found, upload the new image
        const { data, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filename, buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading to Supabase:", uploadError);
          return res
            .status(500)
            .json({ message: `Failed to upload image to Supabase: ${uploadError.message}` });
        }

        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        uploadedImageUrls.push(publicUrlData.publicUrl);
        console.log(`Uploaded new image (checksum: ${checksum}), URL: ${publicUrlData.publicUrl}`);
      }
    }

    return res.json(uploadedImageUrls);
  } catch (error) {
    console.error("Error in image upload handler:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = handleImageUpload;
