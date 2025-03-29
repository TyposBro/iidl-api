// backend/utils/uploadHelper.js
const uploadToSupabase = async (supabaseClient, files, bucketName) => {
  if (!files || files.length === 0) {
    return [];
  }

  const imageUrls = [];
  for (const file of files) {
    const filename = `${Date.now()}-${file.originalname}`;
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading to Supabase:", error);
      throw new Error(`Failed to upload image to Supabase: ${error.message}`);
    }

    const { data: publicUrlData } = supabaseClient.storage.from(bucketName).getPublicUrl(data.path);

    imageUrls.push(publicUrlData.publicUrl);
  }

  console.log("Uploaded images to Supabase:", imageUrls);

  return imageUrls;
};

module.exports = uploadToSupabase;
