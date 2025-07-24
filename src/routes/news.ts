// src/routes/news.ts
import { Hono } from "hono";
import { authenticateAdmin } from "../middleware/auth";
import { App, News } from "../types";
import { getKeyFromR2Url, parseJsonFields } from "../utils";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const news = new Hono<App["_"]["env"]>();

const newsSchema = z.object({
  title: z.string(),
  number: z.number(),
  date: z.string(),
  images: z.array(z.string().url()).optional().nullable(),
  content: z.string(),
  type: z.string(),
});

// GET all news
news.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM news ORDER BY number DESC").all<News>();
  const parsedResults = results.map((n) => parseJsonFields(n, ["images"]));
  return c.json(parsedResults);
});

// CREATE a news item
news.post("/", authenticateAdmin, zValidator("json", newsSchema), async (c) => {
  const item = c.req.valid("json");
  const info = await c.env.DB.prepare(
    "INSERT INTO news (title, number, date, images, content, type) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(
      item.title,
      item.number,
      item.date,
      JSON.stringify(item.images || []),
      item.content,
      item.type
    )
    .run();
  return c.json({ id: info.meta.last_row_id }, 201);
});

// UPDATE a news item
news.put("/:id", authenticateAdmin, zValidator("json", newsSchema), async (c) => {
  const id = c.req.param("id");
  const item = c.req.valid("json");

  const oldItem = await c.env.DB.prepare("SELECT images FROM news WHERE id = ?")
    .bind(id)
    .first<{ images: string }>();
  if (!oldItem) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare(
    "UPDATE news SET title=?, number=?, date=?, images=?, content=?, type=? WHERE id=?"
  )
    .bind(
      item.title,
      item.number,
      item.date,
      JSON.stringify(item.images || []),
      item.content,
      item.type,
      id
    )
    .run();

  const oldImages: string[] = oldItem.images ? JSON.parse(oldItem.images) : [];
  const newImages: string[] = item.images || [];
  const imagesToDelete = oldImages.filter((img) => !newImages.includes(img));

  for (const imageUrl of imagesToDelete) {
    const key = getKeyFromR2Url(imageUrl, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Updated" });
});

// DELETE a news item
news.delete("/:id", authenticateAdmin, async (c) => {
  const id = c.req.param("id");
  const item = await c.env.DB.prepare("SELECT images FROM news WHERE id = ?")
    .bind(id)
    .first<{ images: string }>();
  if (!item) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare("DELETE FROM news WHERE id = ?").bind(id).run();

  const imagesToDelete: string[] = item.images ? JSON.parse(item.images) : [];
  for (const imageUrl of imagesToDelete) {
    const key = getKeyFromR2Url(imageUrl, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Deleted" });
});

export default news;
