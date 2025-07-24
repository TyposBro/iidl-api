// src/routes/gallery.ts
import { Hono } from "hono";
import { authenticateAdmin } from "../middleware/auth";
import { AppContext, GalleryEvent } from "../types";
import { getKeyFromR2Url, parseJsonFields } from "../utils";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const gallery = new Hono<AppContext>();

const galleryEventSchema = z.object({
  title: z.string(),
  number: z.number(),
  date: z.string().datetime(), // ISO 8601
  location: z.string().optional().nullable(),
  images: z.array(z.string().url()).optional().nullable(),
  type: z.string().optional().nullable(),
});

const jsonFields: (keyof GalleryEvent)[] = ["images"];

// GET all gallery events
gallery.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM gallery_events ORDER BY number DESC"
  ).all<GalleryEvent>();
  if (!results) return c.json([]);
  const parsedResults = results.map((e: GalleryEvent) => parseJsonFields(e, jsonFields));
  return c.json(parsedResults);
});

// CREATE a gallery event
gallery.post("/", authenticateAdmin, zValidator("json", galleryEventSchema), async (c) => {
  const event = c.req.valid("json");
  const info = await c.env.DB.prepare(
    "INSERT INTO gallery_events (title, number, date, location, images, type) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(
      event.title,
      event.number,
      event.date,
      event.location,
      JSON.stringify(event.images || []),
      event.type
    )
    .run();

  return c.json({ id: info.meta.last_row_id }, 201);
});

// UPDATE a gallery event
gallery.put("/:id", authenticateAdmin, zValidator("json", galleryEventSchema), async (c) => {
  const id = c.req.param("id");
  const event = c.req.valid("json");

  const oldEvent = await c.env.DB.prepare("SELECT images FROM gallery_events WHERE id = ?")
    .bind(id)
    .first<{ images: string | null }>();
  if (!oldEvent) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare(
    "UPDATE gallery_events SET title=?, number=?, date=?, location=?, images=?, type=? WHERE id=?"
  )
    .bind(
      event.title,
      event.number,
      event.date,
      event.location,
      JSON.stringify(event.images || []),
      event.type,
      id
    )
    .run();

  const oldImages: string[] = oldEvent.images ? JSON.parse(oldEvent.images) : [];
  const newImages: string[] = event.images || [];
  const imagesToDelete = oldImages.filter((img) => !newImages.includes(img));

  for (const imageUrl of imagesToDelete) {
    const key = getKeyFromR2Url(imageUrl, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Updated" });
});

// DELETE a gallery event
gallery.delete("/:id", authenticateAdmin, async (c) => {
  const id = c.req.param("id");
  const event = await c.env.DB.prepare("SELECT images FROM gallery_events WHERE id = ?")
    .bind(id)
    .first<{ images: string | null }>();
  if (!event) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare("DELETE FROM gallery_events WHERE id = ?").bind(id).run();

  const imagesToDelete: string[] = event.images ? JSON.parse(event.images) : [];
  for (const imageUrl of imagesToDelete) {
    const key = getKeyFromR2Url(imageUrl, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Deleted" });
});

export default gallery;
