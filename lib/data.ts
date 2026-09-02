import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { slugify } from "./arabic";
import type { Book, Category, CategoryWithCount, FatwaWithCategory } from "./types";

/** صف الفتوى كما يعيده PostgREST مع التصنيف المرتبط. */
type FatwaRow = Omit<FatwaWithCategory, "category_name" | "category_slug"> & {
  categories?: { name: string; slug: string } | null;
};

const FATWA_COLUMNS =
  "id, number, slug, title, question, answer, category_id, audio_url, audio_label," +
  " audio_duration, audio_path, source, tags, published, views, created_at, updated_at";

const FATWA_SELECT = `${FATWA_COLUMNS}, categories (name, slug)`;

function mapFatwa(row: FatwaRow): FatwaWithCategory {
  const { categories, ...fatwa } = row;
  return {
    ...fatwa,
    category_name: categories?.name ?? null,
    category_slug: categories?.slug ?? null,
  };
}

/* ------------------------------- التصنيفات ------------------------------- */

export const listCategories = cache(async (): Promise<CategoryWithCount[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, fatwas (count)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`تعذّر جلب التصنيفات: ${error.message}`);

  return (data ?? []).map((row) => {
    const { fatwas, ...category } = row as Category & { fatwas?: Array<{ count: number }> };
    return { ...category, fatwa_count: fatwas?.[0]?.count ?? 0 };
  });
});

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`تعذّر جلب التصنيف: ${error.message}`);
  return data;
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name: input.name.trim(),
    slug: input.slug?.trim() || slugify(input.name, "category"),
    description: input.description?.trim() ?? "",
    icon: input.icon?.trim() ?? "",
    sort_order: input.sort_order ?? 0,
  });
  if (error) throw new Error(`تعذّر إضافة التصنيف: ${error.message}`);
}

export async function updateCategory(
  id: number,
  input: { name: string; slug: string; description?: string; icon?: string; sort_order?: number },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() ?? "",
      icon: input.icon?.trim() ?? "",
      sort_order: input.sort_order ?? 0,
    })
    .eq("id", id);
  if (error) throw new Error(`تعذّر حفظ التصنيف: ${error.message}`);
}

export async function deleteCategory(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(`تعذّر حذف التصنيف: ${error.message}`);
}

export async function isCategoryNameTaken(name: string, ignoreId?: number): Promise<boolean> {
  const supabase = await createClient();
  const query = supabase.from("categories").select("id").eq("name", name.trim());
  const { data } = ignoreId ? await query.neq("id", ignoreId) : await query;
  return (data ?? []).length > 0;
}

export async function isCategorySlugTaken(slug: string, ignoreId?: number): Promise<boolean> {
  const supabase = await createClient();
  const query = supabase.from("categories").select("id").eq("slug", slug.trim());
  const { data } = ignoreId ? await query.neq("id", ignoreId) : await query;
  return (data ?? []).length > 0;
}

/* -------------------------------- الفتاوى -------------------------------- */

type ListOptions = {
  categorySlug?: string;
  includeUnpublished?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
};

/** شروط البحث النصي في لوحة التحكم (عنوان أو سؤال أو رقم). */
function searchClauses(search: string): string {
  const cleaned = search.replace(/[,()*%]/g, " ").trim();
  const asNumber = Number(cleaned);
  const clauses = [`title.ilike.*${cleaned}*`, `question.ilike.*${cleaned}*`];
  if (Number.isInteger(asNumber) && asNumber > 0) clauses.push(`number.eq.${asNumber}`);
  return clauses.join(",");
}

export async function listFatwas(options: ListOptions = {}): Promise<FatwaWithCategory[]> {
  const supabase = await createClient();
  const join = options.categorySlug ? "categories!inner (name, slug)" : "categories (name, slug)";
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  let query = supabase.from("fatwas").select(`${FATWA_COLUMNS}, ${join}`);
  if (!options.includeUnpublished) query = query.eq("published", true);
  if (options.categorySlug) query = query.eq("categories.slug", options.categorySlug);
  if (options.search?.trim()) query = query.or(searchClauses(options.search));

  const { data, error } = await query
    .order("number", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(`تعذّر جلب الفتاوى: ${error.message}`);
  return (data as unknown as FatwaRow[]).map(mapFatwa);
}

export async function countFatwas(options: ListOptions = {}): Promise<number> {
  const supabase = await createClient();
  const join = options.categorySlug ? "categories!inner (slug)" : "categories (slug)";
  let query = supabase.from("fatwas").select(`id, ${join}`, { count: "exact", head: true });
  if (!options.includeUnpublished) query = query.eq("published", true);
  if (options.categorySlug) query = query.eq("categories.slug", options.categorySlug);
  if (options.search?.trim()) query = query.or(searchClauses(options.search));

  const { count, error } = await query;
  if (error) throw new Error(`تعذّر حساب عدد الفتاوى: ${error.message}`);
  return count ?? 0;
}

export async function getFatwaByNumber(
  number: number,
  includeUnpublished = false,
): Promise<FatwaWithCategory | null> {
  const supabase = await createClient();
  let query = supabase.from("fatwas").select(FATWA_SELECT).eq("number", number);
  if (!includeUnpublished) query = query.eq("published", true);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`تعذّر جلب الفتوى: ${error.message}`);
  return data ? mapFatwa(data as unknown as FatwaRow) : null;
}

export async function getFatwaById(id: number): Promise<FatwaWithCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("fatwas").select(FATWA_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`تعذّر جلب الفتوى: ${error.message}`);
  return data ? mapFatwa(data as unknown as FatwaRow) : null;
}

export async function incrementFatwaViews(number: number): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_fatwa_views", { p_number: number });
}

export async function nextFatwaNumber(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fatwas")
    .select("number")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.number ?? 1000) + 1;
}

export async function isFatwaNumberTaken(number: number, ignoreId?: number): Promise<boolean> {
  const supabase = await createClient();
  const query = supabase.from("fatwas").select("id").eq("number", number);
  const { data } = ignoreId ? await query.neq("id", ignoreId) : await query;
  return (data ?? []).length > 0;
}

export async function isFatwaSlugTaken(slug: string, ignoreId?: number): Promise<boolean> {
  const supabase = await createClient();
  const query = supabase.from("fatwas").select("id").eq("slug", slug);
  const { data } = ignoreId ? await query.neq("id", ignoreId) : await query;
  return (data ?? []).length > 0;
}

/** يبني رابطًا فريدًا للفتوى بإضافة لاحقة رقمية عند التكرار. */
export async function uniqueFatwaSlug(base: string, ignoreId?: number): Promise<string> {
  const root = base || "fatwa";
  let slug = root;
  let suffix = 2;
  while (await isFatwaSlugTaken(slug, ignoreId)) slug = `${root}-${suffix++}`;
  return slug;
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
  published: boolean;
};

export async function createFatwa(input: FatwaInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("fatwas").insert(input);
  if (error) throw new Error(`تعذّر حفظ الفتوى: ${error.message}`);
}

export async function updateFatwa(id: number, input: FatwaInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fatwas")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`تعذّر حفظ التعديلات: ${error.message}`);
}

export async function deleteFatwa(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("fatwas").delete().eq("id", id);
  if (error) throw new Error(`تعذّر حذف الفتوى: ${error.message}`);
}

export async function setFatwaAudio(
  id: number,
  audio: { url: string; label?: string; duration?: string; path?: string },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fatwas")
    .update({
      audio_url: audio.url.trim(),
      audio_label: audio.label?.trim() ?? "",
      audio_duration: audio.duration?.trim() ?? "",
      audio_path: audio.path ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`تعذّر حفظ التسجيل: ${error.message}`);
}

export async function clearFatwaAudio(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fatwas")
    .update({
      audio_url: "",
      audio_label: "",
      audio_duration: "",
      audio_path: "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`تعذّر حذف التسجيل: ${error.message}`);
}

/* ------------------------------ البحث النصي ------------------------------ */

/**
 * بحث نصي عربي داخل Postgres: تطبيع النص ثم مطابقة full-text
 * مع تدرّج (كلمات دالّة ← كل الكلمات ← مطابقة تقريبية للأخطاء الإملائية).
 */
export async function searchFatwasText(
  query: string,
  limit = 30,
): Promise<Array<FatwaWithCategory & { score: number }>> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_fatwas", { q: trimmed, max_results: limit });
  if (error) throw new Error(`تعذّر البحث: ${error.message}`);

  const rows = (data ?? []) as Array<
    Omit<FatwaWithCategory, "audio_path"> & { rank: number }
  >;
  const best = rows[0]?.rank || 1;

  return rows.map((row) => {
    const { rank, ...fatwa } = row;
    return {
      ...fatwa,
      audio_path: "",
      score: best > 0 ? Math.max(0, Math.min(1, rank / best)) : 0,
    };
  });
}

/* --------------------------------- الكتب --------------------------------- */

export async function listBooks(): Promise<Book[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(`تعذّر جلب المؤلفات: ${error.message}`);
  return data ?? [];
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

export async function createBook(input: BookInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("books").insert(input);
  if (error) throw new Error(`تعذّر إضافة الكتاب: ${error.message}`);
}

export async function updateBook(id: number, input: BookInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("books").update(input).eq("id", id);
  if (error) throw new Error(`تعذّر حفظ الكتاب: ${error.message}`);
}

export async function deleteBook(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw new Error(`تعذّر حذف الكتاب: ${error.message}`);
}

/* ------------------------------- الإعدادات ------------------------------- */

export const getSettings = cache(async (): Promise<Record<string, string>> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) throw new Error(`تعذّر جلب إعدادات الموقع: ${error.message}`);
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
});

export async function saveSettings(values: Record<string, string>): Promise<void> {
  const supabase = await createClient();
  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(`تعذّر حفظ الإعدادات: ${error.message}`);
}

/* ------------------------------ إحصائيات ------------------------------ */

export async function getStats() {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };

  const [fatwas, categories, books, published, withAudio, viewsRows] = await Promise.all([
    supabase.from("fatwas").select("id", head),
    supabase.from("categories").select("id", head),
    supabase.from("books").select("id", head),
    supabase.from("fatwas").select("id", head).eq("published", true),
    supabase.from("fatwas").select("id", head).neq("audio_url", ""),
    supabase.from("fatwas").select("views"),
  ]);

  const views = (viewsRows.data ?? []).reduce((total, row) => total + (row.views ?? 0), 0);

  return {
    fatwas: fatwas.count ?? 0,
    categories: categories.count ?? 0,
    books: books.count ?? 0,
    published: published.count ?? 0,
    withAudio: withAudio.count ?? 0,
    views,
  };
}

/* --------------------------- الفتاوى المحفوظة --------------------------- */

export async function listSavedFatwas(): Promise<FatwaWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_fatwas")
    .select(`created_at, fatwas (${FATWA_SELECT})`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`تعذّر جلب المحفوظات: ${error.message}`);

  return (data ?? [])
    .map((row) => (row as unknown as { fatwas: FatwaRow | null }).fatwas)
    .filter((fatwa): fatwa is FatwaRow => Boolean(fatwa))
    .map(mapFatwa);
}

export async function getSavedFatwaIds(): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("saved_fatwas").select("fatwa_id");
  return (data ?? []).map((row) => row.fatwa_id as number);
}

export async function isFatwaSaved(fatwaId: number): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_fatwas")
    .select("fatwa_id")
    .eq("fatwa_id", fatwaId)
    .maybeSingle();
  return Boolean(data);
}

export async function saveFatwa(userId: string, fatwaId: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_fatwas")
    .upsert({ user_id: userId, fatwa_id: fatwaId }, { onConflict: "user_id,fatwa_id" });
  if (error) throw new Error(`تعذّر حفظ الفتوى: ${error.message}`);
}

export async function unsaveFatwa(fatwaId: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_fatwas").delete().eq("fatwa_id", fatwaId);
  if (error) throw new Error(`تعذّر إزالة الفتوى: ${error.message}`);
}

export async function clearSavedFatwas(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_fatwas").delete().eq("user_id", userId);
  if (error) throw new Error(`تعذّر مسح المحفوظات: ${error.message}`);
}
