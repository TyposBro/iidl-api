// src/routes/professor.ts
import { Hono } from "hono";
import { authenticateAdmin } from "../middleware/auth";
import { AppContext, Professor } from "../types";
import { parseJsonFields } from "../utils";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const professor = new Hono<AppContext>();

const statSchema = z.object({ key: z.string(), value: z.number() });
const backgroundItemSchema = z.object({ period: z.string(), desc: z.string() });
const backgroundSchema = z.object({ type: z.string(), items: z.array(backgroundItemSchema) });

const professorSchema = z.object({
  name: z.string(),
  role: z.string().optional().nullable(),
  img: z.string().url().optional().nullable(),
  desc: z.string().optional().nullable(),
  cvLink: z.string().url().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  stats: z.array(statSchema).optional().nullable(),
  interests: z.string().optional().nullable(),
  background: z.array(backgroundSchema).optional().nullable(),
});

const jsonFields: (keyof Professor)[] = ["stats", "background"];

// Since there is only one professor, we treat it as a singleton.
// GET the professor's data
professor.get("/", async (c) => {
  // There should only be one row.
  const result = await c.env.DB.prepare("SELECT * FROM professors LIMIT 1").first<Professor>();
  if (!result) return c.json({ message: "Not Found" }, 404);

  const parsedResult = parseJsonFields(result, jsonFields);
  return c.json(parsedResult);
});

// UPDATE the professor's data (Upsert logic)
professor.post("/", authenticateAdmin, zValidator("json", professorSchema), async (c) => {
  const data = c.req.valid("json");

  // Check if a professor record exists
  const existing = await c.env.DB.prepare("SELECT id FROM professors LIMIT 1").first<{
    id: number;
  }>();

  if (existing) {
    // Update existing record
    await c.env.DB.prepare(
      `UPDATE professors SET name=?, role=?, img=?, "desc"=?, cvLink=?, email=?, phone=?, stats=?, interests=?, background=? WHERE id=?`
    )
      .bind(
        data.name,
        data.role,
        data.img,
        data.desc,
        data.cvLink,
        data.email,
        data.phone,
        JSON.stringify(data.stats || []),
        data.interests,
        JSON.stringify(data.background || []),
        existing.id
      )
      .run();
    return c.json({ message: "Professor data updated" });
  } else {
    // Insert new record
    const info = await c.env.DB.prepare(
      `INSERT INTO professors (name, role, img, "desc", cvLink, email, phone, stats, interests, background) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        data.name,
        data.role,
        data.img,
        data.desc,
        data.cvLink,
        data.email,
        data.phone,
        JSON.stringify(data.stats || []),
        data.interests,
        JSON.stringify(data.background || [])
      )
      .run();
    return c.json({ message: "Professor data created", id: info.meta.last_row_id }, 201);
  }
});

export default professor;
