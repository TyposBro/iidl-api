// src/routes/project.ts
import { Hono } from "hono";
import { authenticateAdmin } from "../middleware/auth";
import { AppContext, Project } from "../types"; // <-- Use AppContext and specific models
import { getKeyFromR2Url, parseJsonFields } from "../utils";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const projects = new Hono<AppContext>(); // <-- Use the shared AppContext

const projectSchema = z.object({
  title: z.string(),
  number: z.number(),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
  link: z.string().url().optional().nullable(),
  status: z.enum(["current", "completed", "award"]),
  year: z.number().optional().nullable(),
  awardName: z.string().optional().nullable(),
  authors: z.array(z.string()).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

const jsonFields: (keyof Project)[] = ["authors", "tags"];

// GET all projects
projects.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM projects ORDER BY number DESC"
  ).all<Project>();
  if (!results) return c.json([]);
  // Add explicit type here to fix 'any' error
  const parsedResults = results.map((p: Project) => parseJsonFields(p, jsonFields));
  return c.json(parsedResults);
});

// GET projects by status
projects.get("/status/:status", async (c) => {
  const status = c.req.param("status");
  if (!["current", "completed", "award"].includes(status)) {
    return c.json({ message: "Invalid status" }, 400);
  }
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE status = ? ORDER BY number DESC"
  )
    .bind(status)
    .all<Project>();
  if (!results) return c.json([]);
  // Add explicit type here
  const parsedResults = results.map((p: Project) => parseJsonFields(p, jsonFields));
  return c.json(parsedResults);
});

// CREATE a project
projects.post("/", authenticateAdmin, zValidator("json", projectSchema), async (c) => {
  const project = c.req.valid("json");
  const now = new Date().toISOString();

  const info = await c.env.DB.prepare(
    "INSERT INTO projects (title, number, subtitle, description, image, link, status, year, awardName, authors, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      project.title,
      project.number,
      project.subtitle,
      project.description,
      project.image,
      project.link,
      project.status,
      project.year,
      project.awardName,
      JSON.stringify(project.authors || []),
      JSON.stringify(project.tags || []),
      now,
      now
    )
    .run();

  return c.json({ id: info.meta.last_row_id }, 201);
});

// UPDATE a project
projects.put("/:id", authenticateAdmin, zValidator("json", projectSchema), async (c) => {
  const id = c.req.param("id");
  const project = c.req.valid("json");

  const oldProject = await c.env.DB.prepare("SELECT image FROM projects WHERE id = ?")
    .bind(id)
    .first<Pick<Project, "image">>();
  if (!oldProject) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare(
    "UPDATE projects SET title=?, number=?, subtitle=?, description=?, image=?, link=?, status=?, year=?, awardName=?, authors=?, tags=? WHERE id=?"
  )
    .bind(
      project.title,
      project.number,
      project.subtitle,
      project.description,
      project.image,
      project.link,
      project.status,
      project.year,
      project.awardName,
      JSON.stringify(project.authors || []),
      JSON.stringify(project.tags || []),
      id
    )
    .run();

  // If image was changed, delete the old one from R2
  if (oldProject.image && oldProject.image !== project.image) {
    const key = getKeyFromR2Url(oldProject.image, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Updated" });
});

// DELETE a project
projects.delete("/:id", authenticateAdmin, async (c) => {
  const id = c.req.param("id");
  const project = await c.env.DB.prepare("SELECT image FROM projects WHERE id = ?")
    .bind(id)
    .first<Pick<Project, "image">>();
  if (!project) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();

  // Delete associated image from R2
  if (project.image) {
    const key = getKeyFromR2Url(project.image, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Deleted" });
});

export default projects;
