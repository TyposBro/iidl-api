// src/routes/publication.ts
import { Hono } from "hono";
import { authenticateAdmin } from "../middleware/auth";
import { App, Publication } from "../types";
import { getKeyFromR2Url, parseJsonFields } from "../utils";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const publications = new Hono<App["_"]["env"]>();

const publicationSchema = z.object({
  title: z.string(),
  number: z.number(),
  authors: z.array(z.string()),
  venue: z.string().optional().nullable(),
  year: z.number(),
  doi: z.string().optional().nullable(),
  link: z.string().url().optional().nullable(),
  abstract: z.string().optional().nullable(),
  type: z.enum(["journal", "conference"]),
  location: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
});

// GET publications by type
publications.get("/type/:type", async (c) => {
  const type = c.req.param("type");
  if (!["journal", "conference"].includes(type)) {
    return c.json({ message: "Invalid type" }, 400);
  }
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM publications WHERE type = ? ORDER BY number DESC"
  )
    .bind(type)
    .all<Publication>();
  const parsedResults = results.map((p) => parseJsonFields(p, ["authors"]));
  return c.json(parsedResults);
});

// For admin panel: GET all publications
publications.get("/", authenticateAdmin, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM publications ORDER BY number DESC"
  ).all<Publication>();
  const parsedResults = results.map((p) => parseJsonFields(p, ["authors"]));
  return c.json(parsedResults);
});

// CREATE a publication
publications.post("/", authenticateAdmin, zValidator("json", publicationSchema), async (c) => {
  const pub = c.req.valid("json");
  const now = new Date().toISOString();
  const info = await c.env.DB.prepare(
    "INSERT INTO publications (title, number, authors, venue, year, doi, link, abstract, type, location, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      pub.title,
      pub.number,
      JSON.stringify(pub.authors),
      pub.venue,
      pub.year,
      pub.doi,
      pub.link,
      pub.abstract,
      pub.type,
      pub.location,
      pub.image,
      now,
      now
    )
    .run();

  return c.json({ id: info.meta.last_row_id }, 201);
});

// UPDATE a publication
publications.put("/:id", authenticateAdmin, zValidator("json", publicationSchema), async (c) => {
  const id = c.req.param("id");
  const pub = c.req.valid("json");

  const oldPub = await c.env.DB.prepare("SELECT image FROM publications WHERE id = ?")
    .bind(id)
    .first<{ image: string }>();
  if (!oldPub) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare(
    "UPDATE publications SET title=?, number=?, authors=?, venue=?, year=?, doi=?, link=?, abstract=?, type=?, location=?, image=? WHERE id=?"
  )
    .bind(
      pub.title,
      pub.number,
      JSON.stringify(pub.authors),
      pub.venue,
      pub.year,
      pub.doi,
      pub.link,
      pub.abstract,
      pub.type,
      pub.location,
      pub.image,
      id
    )
    .run();

  if (oldPub.image && oldPub.image !== pub.image) {
    const key = getKeyFromR2Url(oldPub.image, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Updated" });
});

// DELETE a publication
publications.delete("/:id", authenticateAdmin, async (c) => {
  const id = c.req.param("id");
  const pub = await c.env.DB.prepare("SELECT image FROM publications WHERE id = ?")
    .bind(id)
    .first<{ image: string }>();
  if (!pub) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare("DELETE FROM publications WHERE id = ?").bind(id).run();

  if (pub.image) {
    const key = getKeyFromR2Url(pub.image, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Deleted" });
});

export default publications;
