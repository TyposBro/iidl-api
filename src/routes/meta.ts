// src/routes/meta.ts
import { Hono } from "hono";
import { authenticateAdmin } from "../middleware/auth";
import { App, Meta } from "../types";
import { parseJsonFields } from "../utils";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const meta = new Hono<App["_"]["env"]>();

const metaSchema = z.object({
  pageIdentifier: z.string(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  representativeImages: z.array(z.string().url()).optional().nullable(),
  homeYoutubeId: z.string().optional().nullable(),
  footerAddress: z.string().optional().nullable(),
  footerAddressLink: z.string().url().optional().nullable(),
  footerPhone: z.string().optional().nullable(),
  footerEmail: z.string().email().optional().nullable(),
  footerHeadline: z.string().optional().nullable(),
  footerSubtext: z.string().optional().nullable(),
});

const jsonFields: (keyof Meta)[] = ["representativeImages"];

// GET meta by page identifier
meta.get("/:pageIdentifier", async (c) => {
  const pageIdentifier = c.req.param("pageIdentifier");
  const result = await c.env.DB.prepare("SELECT * FROM meta WHERE pageIdentifier = ?")
    .bind(pageIdentifier)
    .first<Meta>();
  if (!result) return c.json({ message: "Not Found" }, 404);

  return c.json(parseJsonFields(result, jsonFields));
});

// Upsert (Create/Update) meta data
meta.put(
  "/:pageIdentifier",
  authenticateAdmin,
  zValidator("json", metaSchema.omit({ pageIdentifier: true })),
  async (c) => {
    const pageIdentifier = c.req.param("pageIdentifier");
    const data = c.req.valid("json");
    const now = new Date().toISOString();

    const info = await c.env.DB.prepare(
      `INSERT INTO meta (pageIdentifier, title, description, representativeImages, homeYoutubeId, footerAddress, footerAddressLink, footerPhone, footerEmail, footerHeadline, footerSubtext, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(pageIdentifier) DO UPDATE SET
         title=excluded.title, description=excluded.description, representativeImages=excluded.representativeImages, homeYoutubeId=excluded.homeYoutubeId,
         footerAddress=excluded.footerAddress, footerAddressLink=excluded.footerAddressLink, footerPhone=excluded.footerPhone,
         footerEmail=excluded.footerEmail, footerHeadline=excluded.footerHeadline, footerSubtext=excluded.footerSubtext, updatedAt=excluded.updatedAt`
    )
      .bind(
        pageIdentifier,
        data.title,
        data.description,
        JSON.stringify(data.representativeImages || []),
        data.homeYoutubeId,
        data.footerAddress,
        data.footerAddressLink,
        data.footerPhone,
        data.footerEmail,
        data.footerHeadline,
        data.footerSubtext,
        now,
        now
      )
      .run();

    return c.json({ message: "Upserted" });
  }
);

export default meta;
