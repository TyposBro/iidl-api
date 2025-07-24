// src/routes/team.ts
import { Hono } from "hono";
import { authenticateAdmin } from "../middleware/auth";
import { App, TeamMember } from "../types";
import { getKeyFromR2Url } from "../utils";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const team = new Hono<App["_"]["env"]>();

const teamMemberSchema = z.object({
  name: z.string(),
  number: z.number(),
  role: z.string(),
  img: z.string().url(),
  type: z.enum(["current", "alumni"]),
  bio: z.string().optional().nullable(),
  linkedIn: z.string().url().optional().nullable(),
});

// GET all team members
team.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM team_members ORDER BY number ASC"
  ).all<TeamMember>();
  return c.json(results);
});

// CREATE a team member
team.post("/", authenticateAdmin, zValidator("json", teamMemberSchema), async (c) => {
  const member = c.req.valid("json");
  const info = await c.env.DB.prepare(
    "INSERT INTO team_members (name, number, role, img, type, bio, linkedIn) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      member.name,
      member.number,
      member.role,
      member.img,
      member.type,
      member.bio,
      member.linkedIn
    )
    .run();

  return c.json({ id: info.meta.last_row_id }, 201);
});

// UPDATE a team member
team.put("/:id", authenticateAdmin, zValidator("json", teamMemberSchema), async (c) => {
  const id = c.req.param("id");
  const member = c.req.valid("json");

  const oldMember = await c.env.DB.prepare("SELECT img FROM team_members WHERE id = ?")
    .bind(id)
    .first<{ img: string }>();
  if (!oldMember) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare(
    "UPDATE team_members SET name=?, number=?, role=?, img=?, type=?, bio=?, linkedIn=? WHERE id=?"
  )
    .bind(
      member.name,
      member.number,
      member.role,
      member.img,
      member.type,
      member.bio,
      member.linkedIn,
      id
    )
    .run();

  if (oldMember.img && oldMember.img !== member.img) {
    const key = getKeyFromR2Url(oldMember.img, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Updated" });
});

// DELETE a team member
team.delete("/:id", authenticateAdmin, async (c) => {
  const id = c.req.param("id");
  const member = await c.env.DB.prepare("SELECT img FROM team_members WHERE id = ?")
    .bind(id)
    .first<{ img: string }>();
  if (!member) return c.json({ message: "Not Found" }, 404);

  await c.env.DB.prepare("DELETE FROM team_members WHERE id = ?").bind(id).run();

  if (member.img) {
    const key = getKeyFromR2Url(member.img, c.env.R2_PUBLIC_URL);
    if (key) await c.env.R2_BUCKET.delete(key);
  }

  return c.json({ message: "Deleted" });
});

export default team;
