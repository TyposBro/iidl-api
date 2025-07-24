// src/routes/auth.ts
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppContext, Admin } from "../types";
import { verifyPassword } from "../utils";

const auth = new Hono<AppContext>();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { username, password } = c.req.valid("json");
  const envUsername = c.env.ADMIN_USERNAME;

  // Basic username check
  if (username !== envUsername) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  // Fetch user from DB
  const admin = await c.env.DB.prepare("SELECT id, password_hash FROM admins WHERE username = ?")
    .bind(username)
    .first<Pick<Admin, "id" | "password_hash">>();

  if (!admin || !admin.password_hash) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  // Verify password hash
  const isPasswordValid = await verifyPassword(password, admin.password_hash);
  if (!isPasswordValid) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  // Create JWT
  const payload = {
    adminId: admin.id.toString(),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hour expiration
  };

  const token = await sign(payload, c.env.JWT_SECRET);

  return c.json({ token });
});

export default auth;
