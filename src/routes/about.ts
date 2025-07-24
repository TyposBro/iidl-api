// src/routes/about.ts
import { Hono } from "hono";
import { authenticateAdmin } from "../middleware/auth";
import { App, AboutContent } from "../types";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { parseJsonFields } from "../utils";

const about = new Hono<App["_"]["env"]>();

const contentBlockSchema = z.object({
  title: z.string(),
  text: z.string(),
  img: z.string().url(),
});

const aboutContentSchema = z.object({
  title: z.string(),
  content: z.array(contentBlockSchema),
});

// GET all about content
about.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM about_content").all<AboutContent>();
  const parsedResults = results.map((item) => parseJsonFields(item, ["content"]));
  return c.json(parsedResults);
});

// CREATE about content
about.post("/", authenticateAdmin, zValidator("json", aboutContentSchema), async (c) => {
  const data = c.req.valid("json");
  const now = new Date().toISOString();
  const info = await c.env.DB.prepare(
    "INSERT INTO about_content (title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)"
  )
    .bind(data.title, JSON.stringify(data.content), now, now)
    .run();

  return c.json({ id: info.meta.last_row_id }, 201);
});

// UPDATE about content
about.put("/:id", authenticateAdmin, zValidator("json", aboutContentSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  await c.env.DB.prepare("UPDATE about_content SET title=?, content=? WHERE id=?")
    .bind(data.title, JSON.stringify(data.content), id)
    .run();
  return c.json({ message: "Updated" });
});

// DELETE about content
about.delete("/:id", authenticateAdmin, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM about_content WHERE id = ?").bind(id).run();
  return c.json({ message: "Deleted" });
});

export default about;
