import type Database from "better-sqlite3";
import { normalizeArabic } from "./arabic";

type IndexableFatwa = {
  id: number;
  number: number;
  title: string;
  question: string;
  answer: string;
  tags: string;
};

/**
 * تحديث فهرس البحث النصي لفتوى واحدة.
 * يُخزَّن النص بعد التطبيع حتى يتطابق البحث رغم اختلاف التشكيل والهمزات.
 */
export function indexFatwa(conn: Database.Database, fatwa: IndexableFatwa): void {
  conn.prepare("DELETE FROM fatwas_fts WHERE rowid = ?").run(fatwa.id);
  conn
    .prepare(
      `INSERT INTO fatwas_fts (rowid, title, question, answer, tags)
       VALUES (@rowid, @title, @question, @answer, @tags)`,
    )
    .run({
      rowid: fatwa.id,
      title: normalizeArabic(fatwa.title),
      question: normalizeArabic(fatwa.question),
      answer: normalizeArabic(fatwa.answer),
      tags: `${normalizeArabic(fatwa.tags)} ${fatwa.number}`.trim(),
    });
}

export function removeFatwaFromIndex(conn: Database.Database, id: number): void {
  conn.prepare("DELETE FROM fatwas_fts WHERE rowid = ?").run(id);
}
