import "server-only";
import { db } from "./db";
import { indexFatwa, removeFatwaFromIndex } from "./index-fts";
import { normalizeArabic, slugify, tokenize } from "./arabic";
import type { Book, Category, CategoryWithCount, Fatwa, FatwaWithCategory } from "./types";

const FATWA_SELECT = `
  SELECT f.*, c.name AS category_name, c.slug AS category_slug
  FROM fatwas f
  LEFT JOIN categories c ON c.id = f.category_id
`;

/* ------------------------------- التصنيفات ------------------------------- */

export function listCategories(): CategoryWithCount[] {
  return db()
    .prepare(
      `SELECT c.*, (
         SELECT COUNT(*) FROM fatwas f WHERE f.category_id = c.id AND f.published = 1
       ) AS fatwa_count
       FROM categories c
       ORDER BY c.sort_order ASC, c.name ASC`,
    )
    .all() as CategoryWithCount[];
}

export function getCategoryBySlug(slug: string): Category | null {
  return (db().prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as Category) ?? null;
}

export function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}): number {
  const slug = uniqueCategorySlug(input.slug?.trim() || slugify(input.name, "category"));
  const result = db()
    .prepare(
      `INSERT INTO categories (name, slug, description, icon, sort_order)
       VALUES (@name, @slug, @description, @icon, @sort_order)`,
    )
    .run({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() ?? "",
      icon: input.icon?.trim() ?? "",
      sort_order: input.sort_order ?? 0,
    });
  return Number(result.lastInsertRowid);
}

export function updateCategory(
  id: number,
  input: { name: string; slug: string; description?: string; icon?: string; sort_order?: number },
): void {
  db()
    .prepare(
      `UPDATE categories
       SET name = @name, slug = @slug, description = @description, icon = @icon, sort_order = @sort_order
       WHERE id = @id`,
    )
    .run({
      id,
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() ?? "",
      icon: input.icon?.trim() ?? "",
      sort_order: input.sort_order ?? 0,
    });
}

export function deleteCategory(id: number): void {
  db().prepare("DELETE FROM categories WHERE id = ?").run(id);
}

export function isCategorySlugTaken(slug: string, ignoreId?: number): boolean {
  const row = db()
    .prepare("SELECT id FROM categories WHERE slug = ? AND id != ?")
    .get(slug, ignoreId ?? 0);
  return Boolean(row);
}

export function isCategoryNameTaken(name: string, ignoreId?: number): boolean {
  const row = db()
    .prepare("SELECT id FROM categories WHERE name = ? AND id != ?")
    .get(name, ignoreId ?? 0);
  return Boolean(row);
}

function uniqueCategorySlug(base: string, ignoreId?: number): string {
  const exists = db().prepare(
    "SELECT id FROM categories WHERE slug = ? AND (? IS NULL OR id != ?)",
  );
  let slug = base;
  let n = 2;
  while (exists.get(slug, ignoreId ?? null, ignoreId ?? 0)) slug = `${base}-${n++}`;
  return slug;
}

/* -------------------------------- الفتاوى -------------------------------- */

export function listFatwas(options: {
  categorySlug?: string;
  includeUnpublished?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
} = {}): FatwaWithCategory[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (!options.includeUnpublished) where.push("f.published = 1");
  if (options.categorySlug) {
    where.push("c.slug = @categorySlug");
    params.categorySlug = options.categorySlug;
  }
  if (options.search?.trim()) {
    where.push("(f.title LIKE @like OR f.question LIKE @like OR CAST(f.number AS TEXT) LIKE @like)");
    params.like = `%${options.search.trim()}%`;
  }

  const sql = `${FATWA_SELECT}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY f.number DESC
    LIMIT @limit OFFSET @offset`;

  return db()
    .prepare(sql)
    .all({ ...params, limit: options.limit ?? 20, offset: options.offset ?? 0 }) as FatwaWithCategory[];
}

export function countFatwas(options: {
  categorySlug?: string;
  includeUnpublished?: boolean;
  search?: string;
} = {}): number {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (!options.includeUnpublished) where.push("f.published = 1");
  if (options.categorySlug) {
    where.push("c.slug = @categorySlug");
    params.categorySlug = options.categorySlug;
  }
  if (options.search?.trim()) {
    where.push("(f.title LIKE @like OR f.question LIKE @like OR CAST(f.number AS TEXT) LIKE @like)");
    params.like = `%${options.search.trim()}%`;
  }
  const row = db()
    .prepare(
      `SELECT COUNT(*) AS total FROM fatwas f
       LEFT JOIN categories c ON c.id = f.category_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`,
    )
    .get(params) as { total: number };
  return row.total;
}

export function getFatwaByNumber(number: number, includeUnpublished = false): FatwaWithCategory | null {
  const row = db()
    .prepare(`${FATWA_SELECT} WHERE f.number = ? ${includeUnpublished ? "" : "AND f.published = 1"}`)
    .get(number) as FatwaWithCategory | undefined;
  return row ?? null;
}

export function getFatwaById(id: number): FatwaWithCategory | null {
  const row = db().prepare(`${FATWA_SELECT} WHERE f.id = ?`).get(id) as FatwaWithCategory | undefined;
  return row ?? null;
}

export function getFatwasByNumbers(numbers: number[]): FatwaWithCategory[] {
  if (numbers.length === 0) return [];
  const placeholders = numbers.map(() => "?").join(",");
  return db()
    .prepare(`${FATWA_SELECT} WHERE f.number IN (${placeholders}) AND f.published = 1`)
    .all(...numbers) as FatwaWithCategory[];
}

export function incrementFatwaViews(id: number): void {
  db().prepare("UPDATE fatwas SET views = views + 1 WHERE id = ?").run(id);
}

/** أعلى رقم فتوى مستخدم + 1، لاقتراح رقم للفتوى الجديدة. */
export function nextFatwaNumber(): number {
  const row = db().prepare("SELECT MAX(number) AS max FROM fatwas").get() as { max: number | null };
  return (row.max ?? 1000) + 1;
}

export function isFatwaNumberTaken(number: number, ignoreId?: number): boolean {
  const row = db()
    .prepare("SELECT id FROM fatwas WHERE number = ? AND id != ?")
    .get(number, ignoreId ?? 0);
  return Boolean(row);
}

/** يبني رابطًا فريدًا للفتوى بإضافة لاحقة رقمية عند التكرار. */
export function uniqueFatwaSlug(base: string, ignoreId?: number): string {
  const root = base || "fatwa";
  let slug = root;
  let suffix = 2;
  while (isFatwaSlugTaken(slug, ignoreId)) slug = `${root}-${suffix++}`;
  return slug;
}

export function isFatwaSlugTaken(slug: string, ignoreId?: number): boolean {
  const row = db()
    .prepare("SELECT id FROM fatwas WHERE slug = ? AND id != ?")
    .get(slug, ignoreId ?? 0);
  return Boolean(row);
}

export type FatwaInput = {
  number: number;
  slug: string;
  title: string;
  question: string;
  answer: string;
  category_id: number | null;
  audio_url: string;
  audio_label: string;
  audio_duration: string;
  source: string;
  tags: string;
  published: number;
};

export function createFatwa(input: FatwaInput): number {
  const conn = db();
  const result = conn
    .prepare(
      `INSERT INTO fatwas
        (number, slug, title, question, answer, category_id, audio_url, audio_label,
         audio_duration, source, tags, published)
       VALUES
        (@number, @slug, @title, @question, @answer, @category_id, @audio_url, @audio_label,
         @audio_duration, @source, @tags, @published)`,
    )
    .run(input);
  const id = Number(result.lastInsertRowid);
  indexFatwa(conn, { id, ...input });
  return id;
}

export function updateFatwa(id: number, input: FatwaInput): void {
  const conn = db();
  conn
    .prepare(
      `UPDATE fatwas SET
        number = @number, slug = @slug, title = @title, question = @question, answer = @answer,
        category_id = @category_id, audio_url = @audio_url, audio_label = @audio_label,
        audio_duration = @audio_duration, source = @source, tags = @tags, published = @published,
        updated_at = datetime('now')
       WHERE id = @id`,
    )
    .run({ ...input, id });
  indexFatwa(conn, { id, ...input });
}

export function deleteFatwa(id: number): void {
  const conn = db();
  conn.prepare("DELETE FROM fatwas WHERE id = ?").run(id);
  removeFatwaFromIndex(conn, id);
}

export function clearFatwaAudio(id: number): void {
  db()
    .prepare(
      `UPDATE fatwas SET audio_url = '', audio_label = '', audio_duration = '',
       updated_at = datetime('now') WHERE id = ?`,
    )
    .run(id);
}

export function setFatwaAudio(
  id: number,
  audio: { url: string; label?: string; duration?: string },
): void {
  db()
    .prepare(
      `UPDATE fatwas SET audio_url = @url, audio_label = @label, audio_duration = @duration,
       updated_at = datetime('now') WHERE id = @id`,
    )
    .run({ id, url: audio.url.trim(), label: audio.label?.trim() ?? "", duration: audio.duration?.trim() ?? "" });
}

/* ------------------------------ البحث النصي ------------------------------ */

/**
 * بحث نصي داخل الفتاوى باستخدام FTS5 على النص بعد التطبيع،
 * مع تدرّج: مطابقة كل الكلمات ← أي كلمة ← مطابقة جزئية بـ LIKE.
 */
export function searchFatwasText(query: string, limit = 40): Array<FatwaWithCategory & { score: number }> {
  const conn = db();
  const trimmed = query.trim();
  if (!trimmed) return [];

  // رقم الفتوى: بحث مباشر
  const asNumber = Number(normalizeArabic(trimmed));
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const direct = getFatwaByNumber(asNumber);
    if (direct) return [{ ...direct, score: 1 }];
  }

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return [];
  const escaped = tokens.map((t) => `"${t.replace(/"/g, '""')}"*`);

  const runMatch = (matchExpr: string) =>
    conn
      .prepare(
        `SELECT f.*, c.name AS category_name, c.slug AS category_slug,
                bm25(fatwas_fts, 8.0, 4.0, 1.0, 3.0) AS rank
         FROM fatwas_fts
         JOIN fatwas f ON f.id = fatwas_fts.rowid
         LEFT JOIN categories c ON c.id = f.category_id
         WHERE fatwas_fts MATCH ? AND f.published = 1
         ORDER BY rank
         LIMIT ?`,
      )
      .all(matchExpr, limit) as Array<FatwaWithCategory & { rank: number }>;

  let rows: Array<FatwaWithCategory & { rank: number }> = [];
  try {
    if (escaped.length > 1) rows = runMatch(escaped.join(" AND "));
    if (rows.length < 5) {
      const orRows = runMatch(escaped.join(" OR "));
      const seen = new Set(rows.map((r) => r.id));
      rows = [...rows, ...orRows.filter((r) => !seen.has(r.id))];
    }
  } catch {
    rows = [];
  }

  if (rows.length === 0) {
    const like = `%${tokens[0]}%`;
    const fallback = conn
      .prepare(
        `${FATWA_SELECT} WHERE f.published = 1 AND (f.title LIKE ? OR f.question LIKE ? OR f.answer LIKE ?)
         ORDER BY f.number DESC LIMIT ?`,
      )
      .all(like, like, like, limit) as FatwaWithCategory[];
    return fallback.map((row, i) => ({ ...row, score: 0.5 - i * 0.001 }));
  }

  // bm25 يُرجع قيمًا سالبة، الأصغر أفضل — نحوّلها إلى درجة بين 0 و1.
  const best = Math.min(...rows.map((r) => r.rank));
  return rows.slice(0, limit).map((row) => ({
    ...row,
    score: best === 0 ? 1 : Math.max(0, Math.min(1, row.rank / best)),
  }));
}

/* --------------------------------- الكتب --------------------------------- */

export function listBooks(): Book[] {
  return db().prepare("SELECT * FROM books ORDER BY sort_order ASC, id ASC").all() as Book[];
}

export function getBook(id: number): Book | null {
  return (db().prepare("SELECT * FROM books WHERE id = ?").get(id) as Book) ?? null;
}

export type BookInput = {
  title: string;
  description: string;
  year: string;
  publisher: string;
  volumes: string;
  link_url: string;
  sort_order: number;
};

export function createBook(input: BookInput): number {
  const result = db()
    .prepare(
      `INSERT INTO books (title, description, year, publisher, volumes, link_url, sort_order)
       VALUES (@title, @description, @year, @publisher, @volumes, @link_url, @sort_order)`,
    )
    .run(input);
  return Number(result.lastInsertRowid);
}

export function updateBook(id: number, input: BookInput): void {
  db()
    .prepare(
      `UPDATE books SET title = @title, description = @description, year = @year,
       publisher = @publisher, volumes = @volumes, link_url = @link_url, sort_order = @sort_order
       WHERE id = @id`,
    )
    .run({ ...input, id });
}

export function deleteBook(id: number): void {
  db().prepare("DELETE FROM books WHERE id = ?").run(id);
}

/* ------------------------------- الإعدادات ------------------------------- */

export function getSettings(): Record<string, string> {
  const rows = db().prepare("SELECT key, value FROM settings").all() as Array<{
    key: string;
    value: string;
  }>;
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function getSetting(key: string, fallback = ""): string {
  const row = db().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? fallback;
}

export function saveSettings(values: Record<string, string>): void {
  const stmt = db().prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
  );
  db().transaction(() => {
    for (const [key, value] of Object.entries(values)) stmt.run(key, value);
  })();
}

/* ------------------------------- إحصائيات ------------------------------- */

export function getStats() {
  const conn = db();
  const one = (sql: string) => (conn.prepare(sql).get() as { value: number }).value;
  return {
    fatwas: one("SELECT COUNT(*) AS value FROM fatwas"),
    published: one("SELECT COUNT(*) AS value FROM fatwas WHERE published = 1"),
    withAudio: one("SELECT COUNT(*) AS value FROM fatwas WHERE audio_url != ''"),
    categories: one("SELECT COUNT(*) AS value FROM categories"),
    books: one("SELECT COUNT(*) AS value FROM books"),
    views: one("SELECT COALESCE(SUM(views), 0) AS value FROM fatwas"),
  };
}

export type { Fatwa };
