// src/types.ts
import { Hono } from "hono";

// Define the environment bindings available to the worker
export type Env = {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
  ADMIN_USERNAME: string;
  JWT_SECRET: string;
};

// Define the context variable for authenticated routes
export type AuthVariables = {
  adminId: string;
};

// This is the generic context type for our Hono app.
// We'll use this in all our route files.
export type AppContext = {
  Bindings: Env;
  Variables: AuthVariables;
};

// Re-export the Hono instance type for convenience
export type App = Hono<AppContext>;

// --- Data Models (mirroring D1 schema) ---

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
}

export interface Professor {
  id: number;
  name: string;
  role: string | null;
  img: string | null;
  desc: string | null;
  cvLink: string | null;
  email: string | null;
  phone: string | null;
  // Stored as JSON strings in D1
  stats: string | null; // JSON: { key: string, value: number }[]
  interests: string | null;
  background: string | null; // JSON: { type: string, items: { period: string, desc: string }[] }[]
}

export interface TeamMember {
  id: number;
  name: string;
  number: number;
  role: string;
  img: string;
  type: "current" | "alumni";
  bio: string | null;
  linkedIn: string | null;
}

export interface Project {
  id: number;
  title: string;
  number: number;
  subtitle: string | null;
  description: string | null;
  image: string | null;
  link: string | null;
  status: "current" | "completed" | "award";
  year: number | null;
  awardName: string | null;
  // Stored as JSON strings
  authors: string | null; // JSON: string[]
  tags: string | null; // JSON: string[]
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: number;
  title: string;
  number: number;
  venue: string | null;
  year: number;
  doi: string | null;
  link: string | null;
  abstract: string | null;
  type: "journal" | "conference";
  location: string | null;
  image: string | null;
  // Stored as JSON strings
  authors: string; // JSON: string[]
  createdAt: string;
  updatedAt: string;
}

export interface News {
  id: number;
  title: string;
  number: number;
  date: string;
  content: string;
  type: string;
  // Stored as JSON strings
  images: string | null; // JSON: string[]
}

export interface GalleryEvent {
  id: number;
  title: string;
  number: number;
  date: string; // Stored as ISO 8601 string
  location: string | null;
  type: string | null;
  // Stored as JSON strings
  images: string | null; // JSON: string[]
}

export interface AboutContent {
  id: number;
  title: string;
  // Stored as JSON string
  content: string; // JSON: { title: string, text: string, img: string }[]
  createdAt: string;
  updatedAt: string;
}

export interface Meta {
  id: number;
  pageIdentifier: string;
  title: string | null;
  description: string | null;
  // Stored as JSON string
  representativeImages: string | null; // JSON: string[]
  homeYoutubeId: string | null;
  footerAddress: string | null;
  footerAddressLink: string | null;
  footerPhone: string | null;
  footerEmail: string | null;
  footerHeadline: string | null;
  footerSubtext: string | null;
  createdAt: string;
  updatedAt: string;
}
