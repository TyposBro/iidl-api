// src/middleware/auth.ts
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { App } from "../types";

export const authenticateAdmin = createMiddleware<App["Variables"]>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Authentication required" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const secret = c.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment");
  }

  try {
    const decoded = await verify(token, secret);
    if (!decoded.adminId) {
      return c.json({ message: "Invalid token payload" }, 401);
    }
    c.set("adminId", decoded.adminId as string);
    await next();
  } catch (err) {
    return c.json({ message: "Invalid token" }, 401);
  }
});
