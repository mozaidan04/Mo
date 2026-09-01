import Database from "better-sqlite3";
import { seedDatabase } from "./seed";
import fs from "node:fs";
import path from "node:path";

let instance: Database.Database | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fatwas (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  number         INTEGER NOT NULL UNIQUE,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  question       TEXT NOT NULL,
  answer         TEXT NOT NULL,
  category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  audio_url      TEXT NOT NULL DEFAULT '',
  audio_label    TEXT NOT NULL DEFAULT '',
  audio_duration TEXT NOT NULL DEFAULT '',
  source         TEXT NOT NULL DEFAULT '',
  tags           TEXT NOT NULL DEFAULT '',
  published      INTEGER NOT NULL DEFAULT 1,
  views          INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fatwas_category ON fatwas(category_id);
CREATE INDEX IF NOT EXISTS idx_fatwas_number ON fatwas(number);

CREATE VIRTUAL TABLE IF NOT EXISTS fatwas_fts
  USING fts5(title, question, answer, tags, tokenize = 'unicode61 remove_diacritics 2');

CREATE TABLE IF NOT EXISTS books (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  year        TEXT NOT NULL DEFAULT '',
  publisher   TEXT NOT NULL DEFAULT '',
  volumes     TEXT NOT NULL DEFAULT '',
  link_url    TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function resolveDbPath(): string {
  const configured = process.env.FATAWA_DB_PATH;
  const file = configured
    ? path.resolve(/* turbopackIgnore: true */ process.cwd(), configured)
    : path.join(process.cwd(), "data", "fatawa.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return file;
}

/**
 * اتصال واحد بقاعدة البيانات يُنشأ عند أول استخدام،
 * ويُنشئ الجداول والبيانات الأولية إن لم تكن موجودة.
 */
export function db(): Database.Database {
  if (instance) return instance;

  const conn = new Database(resolveDbPath());
  conn.exec(SCHEMA);
  instance = conn;

  // البذرة الأولى: تُنفَّذ مرة واحدة على قاعدة بيانات فارغة.
  const { count } = conn.prepare("SELECT COUNT(*) AS count FROM fatwas").get() as { count: number };
  if (count === 0) {
    seedDatabase(conn);
  }

  return instance;
}
