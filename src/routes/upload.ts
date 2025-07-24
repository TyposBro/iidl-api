// src/routes/upload.ts
import { Hono } from "hono";
import { AppContext } from "../types";
import { authenticateAdmin } from "../middleware/auth";

const upload = new Hono<AppContext>();

const bufferToHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

upload.post("/", authenticateAdmin, async (c) => {
  const formData = await c.req.formData();
  const files = formData.getAll("images"); // 'images' is the field name
  const uploadedUrls = [];
  const publicUrlBase = c.env.R2_PUBLIC_URL;

  if (files.length === 0) {
    return c.json({ message: "No files to upload" }, 400);
  }

  for (const file of files) {
    if (file instanceof File) {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const checksum = bufferToHex(hashBuffer);
      const fileExtension = file.name.split(".").pop() || "bin";
      const key = `${checksum}.${fileExtension}`;

      // Check if file already exists
      const object = await c.env.R2_BUCKET.head(key);

      if (object === null) {
        // Upload new file
        await c.env.R2_BUCKET.put(key, buffer, {
          httpMetadata: { contentType: file.type },
        });
      }

      uploadedUrls.push(`${publicUrlBase}${key}`);
    }
  }

  return c.json(uploadedUrls);
});

export default upload;
