import { Hono } from "hono";
import { cors } from "hono/cors";
import { App } from "./types";

// Import route handlers
import professorRoutes from "./routes/professor";
import teamRoutes from "./routes/team";
import projectRoutes from "./routes/project";
import publicationRoutes from "./routes/publication";
import newsRoutes from "./routes/news";
import galleryRoutes from "./routes/gallery";
import authRoutes from "./routes/auth";
import aboutRoutes from "./routes/about";
import metaRoutes from "./routes/meta";
import uploadRoutes from "./routes/upload";

const app: App = new Hono();

// --- Middleware ---
app.use("*", cors()); // Enable CORS for all routes

// --- API Routes ---
app.route("/auth", authRoutes);
app.route("/upload", uploadRoutes); // Centralized upload endpoint

app.route("/prof", professorRoutes);
app.route("/team", teamRoutes);
app.route("/projects", projectRoutes);
app.route("/publications", publicationRoutes);
app.route("/news", newsRoutes);
app.route("/gallery", galleryRoutes);
app.route("/about", aboutRoutes);
app.route("/meta", metaRoutes);

// --- Health Check Route ---
app.get("/health", (c) => {
  return c.json({ status: "OK" });
});

// --- Error Handling ---
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

export default app;
