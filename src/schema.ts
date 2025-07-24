// src/schema.ts

// This file contains the SQL statements to create the D1 database schema.
// Run this with `wrangler d1 execute <db-name> --file=./src/schema.ts`

export const schema = `
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

DROP TABLE IF EXISTS professors;
CREATE TABLE professors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    img TEXT,
    desc TEXT,
    cvLink TEXT,
    email TEXT,
    phone TEXT,
    stats TEXT, -- JSON array of {key, value}
    interests TEXT,
    background TEXT -- JSON array of background items
);

DROP TABLE IF EXISTS team_members;
CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    role TEXT NOT NULL,
    img TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('current', 'alumni')),
    bio TEXT,
    linkedIn TEXT
);

DROP TABLE IF EXISTS projects;
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    subtitle TEXT,
    description TEXT,
    image TEXT,
    link TEXT,
    status TEXT NOT NULL CHECK(status IN ('current', 'completed', 'award')),
    year INTEGER,
    awardName TEXT,
    authors TEXT, -- JSON array of strings
    tags TEXT, -- JSON array of strings
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS publications;
CREATE TABLE publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    authors TEXT NOT NULL, -- JSON array of strings
    venue TEXT,
    year INTEGER NOT NULL,
    doi TEXT,
    link TEXT,
    abstract TEXT,
    type TEXT NOT NULL CHECK(type IN ('journal', 'conference')),
    location TEXT,
    image TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS news;
CREATE TABLE news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    date TEXT NOT NULL,
    images TEXT, -- JSON array of strings
    content TEXT NOT NULL,
    type TEXT NOT NULL
);

DROP TABLE IF EXISTS gallery_events;
CREATE TABLE gallery_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    number INTEGER NOT NULL,
    date TEXT NOT NULL, -- ISO 8601 string
    location TEXT,
    images TEXT, -- JSON array of strings
    type TEXT
);

DROP TABLE IF EXISTS about_content;
CREATE TABLE about_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON array of content blocks
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS meta;
CREATE TABLE meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pageIdentifier TEXT NOT NULL UNIQUE,
    title TEXT,
    description TEXT,
    representativeImages TEXT, -- JSON array of strings
    homeYoutubeId TEXT,
    footerAddress TEXT,
    footerAddressLink TEXT,
    footerPhone TEXT,
    footerEmail TEXT,
    footerHeadline TEXT,
    footerSubtext TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Triggers to update the 'updatedAt' column on every update
CREATE TRIGGER IF NOT EXISTS update_projects_updatedAt AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_publications_updatedAt AFTER UPDATE ON publications
BEGIN
    UPDATE publications SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_about_content_updatedAt AFTER UPDATE ON about_content
BEGIN
    UPDATE about_content SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_meta_updatedAt AFTER UPDATE ON meta
BEGIN
    UPDATE meta SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
`;

// Exporting schema for wrangler to use
export default schema;
