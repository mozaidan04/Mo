"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "node:path";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createBook,
  createCategory,
  createFatwa,
  deleteBook,
  deleteCategory,
  deleteFatwa,
  clearFatwaAudio,
  getFatwaById,
  isCategoryNameTaken,
  isCategorySlugTaken,
  isFatwaNumberTaken,
  isFatwaSlugTaken,
  saveSettings,
  setFatwaAudio,
  uniqueFatwaSlug,
  updateBook,
  updateCategory,
  updateFatwa,
} from "@/lib/data";
import { slugify } from "@/lib/arabic";

export type ActionState = { ok: boolean; message: string };

const OK = (message: string): ActionState => ({ ok: true, message });
const FAIL = (message: string): ActionState => ({ ok: false, message });

const AUDIO_BUCKET = "fatwa-audio";
const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".m4a", ".ogg", ".opus", ".wav", ".aac", ".webm"];
const MAX_AUDIO_BYTES = 60 * 1024 * 1024;

/** كل إجراء إداري يتحقق من الصلاحية أولًا (وسياسات RLS تحرسه ثانيًا في قاعدة البيانات). */
async function guard(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/no-access");
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function int(formData: FormData, key: string, fallback = 0): number {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

/** يحوّل استثناءات قاعدة البيانات إلى رسالة عربية للنموذج. */
function failure(error: unknown): ActionState {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("row-level security")) {
    return FAIL("لا تملك صلاحية تنفيذ هذا الإجراء.");
  }
  return FAIL(message);
}

/* --------------------------------- الفتاوى -------------------------------- */

async function readFatwaForm(formData: FormData, ignoreId?: number) {
  const title = text(formData, "title");
  const categoryId = int(formData, "category_id", 0);
  // الرابط المكتوب يدويًا يُحترم كما هو، والمتروك فارغًا يُولَّد من العنوان بلا تكرار.
  const typedSlug = text(formData, "slug");

  return {
    number: int(formData, "number"),
    slug: typedSlug || (await uniqueFatwaSlug(slugify(title), ignoreId)),
    title,
    question: text(formData, "question"),
    answer: text(formData, "answer"),
    category_id: categoryId > 0 ? categoryId : null,
    audio_url: text(formData, "audio_url"),
    audio_label: text(formData, "audio_label"),
    audio_duration: text(formData, "audio_duration"),
    source: text(formData, "source"),
    tags: text(formData, "tags"),
    published: Boolean(formData.get("published")),
  };
}

async function validateFatwa(
  input: Awaited<ReturnType<typeof readFatwaForm>>,
  ignoreId?: number,
): Promise<string | null> {
  if (!input.title) return "عنوان الفتوى مطلوب.";
  if (!input.question) return "نص السؤال مطلوب.";
  if (!input.answer) return "نص الإجابة مطلوب.";
  if (!Number.isInteger(input.number) || input.number <= 0)
    return "رقم الفتوى يجب أن يكون عددًا صحيحًا موجبًا.";
  if (await isFatwaNumberTaken(input.number, ignoreId))
    return `رقم الفتوى ${input.number} مستخدم في فتوى أخرى.`;
  if (!input.slug) return "رابط الفتوى (slug) مطلوب.";
  if (await isFatwaSlugTaken(input.slug, ignoreId)) return "رابط الفتوى مستخدم في فتوى أخرى.";
  return null;
}

export async function createFatwaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const input = await readFatwaForm(formData);
  const error = await validateFatwa(input);
  if (error) return FAIL(error);

  try {
    await createFatwa(input);
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/fatwas");
  revalidatePath("/fatwas");
  redirect(`/admin/fatwas?saved=${input.number}`);
}

export async function updateFatwaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = int(formData, "id");
  if (!(await getFatwaById(id))) return FAIL("الفتوى غير موجودة.");

  const input = await readFatwaForm(formData, id);
  const error = await validateFatwa(input, id);
  if (error) return FAIL(error);

  try {
    await updateFatwa(id, input);
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/fatwas");
  revalidatePath(`/fatwas/${input.number}`);
  revalidatePath("/fatwas");
  return OK("تم حفظ التعديلات.");
}

export async function deleteFatwaAction(formData: FormData): Promise<void> {
  await guard();
  await deleteFatwa(int(formData, "id"));
  revalidatePath("/admin/fatwas");
  revalidatePath("/fatwas");
  redirect("/admin/fatwas?deleted=1");
}

/* -------------------------------- التصنيفات ------------------------------- */

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const name = text(formData, "name");
  if (!name) return FAIL("اسم التصنيف مطلوب.");
  if (await isCategoryNameTaken(name)) return FAIL(`التصنيف «${name}» موجود بالفعل.`);

  try {
    await createCategory({
      name,
      slug: text(formData, "slug"),
      description: text(formData, "description"),
      icon: text(formData, "icon"),
      sort_order: int(formData, "sort_order"),
    });
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return OK("تمت إضافة التصنيف.");
}

export async function updateCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = int(formData, "id");
  const name = text(formData, "name");
  const slug = text(formData, "slug") || slugify(name, "category");
  if (!name) return FAIL("اسم التصنيف مطلوب.");
  if (await isCategoryNameTaken(name, id)) return FAIL(`اسم التصنيف «${name}» مستخدم في تصنيف آخر.`);
  if (await isCategorySlugTaken(slug, id)) return FAIL("رابط التصنيف مستخدم في تصنيف آخر.");

  try {
    await updateCategory(id, {
      name,
      slug,
      description: text(formData, "description"),
      icon: text(formData, "icon"),
      sort_order: int(formData, "sort_order"),
    });
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return OK("تم حفظ التصنيف.");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await guard();
  await deleteCategory(int(formData, "id"));
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  redirect("/admin/categories?deleted=1");
}

/* ------------------------------ التسجيلات الصوتية ----------------------------- */

export async function saveAudioAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = int(formData, "id");
  const fatwa = await getFatwaById(id);
  if (!fatwa) return FAIL("الفتوى غير موجودة.");

  let url = text(formData, "audio_url");
  let storagePath = "";
  const file = formData.get("audio_file");

  if (file instanceof File && file.size > 0) {
    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
      return FAIL(`صيغة الملف غير مدعومة. الصيغ المسموحة: ${ALLOWED_AUDIO_EXTENSIONS.join("، ")}`);
    }
    if (file.size > MAX_AUDIO_BYTES) return FAIL("حجم الملف أكبر من 60 ميجابايت.");

    const supabase = await createClient();
    storagePath = `fatwa-${fatwa.number}/${Date.now()}${extension}`;
    const upload = await supabase.storage.from(AUDIO_BUCKET).upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (upload.error) return FAIL(`تعذّر رفع الملف: ${upload.error.message}`);

    url = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }

  if (!url) return FAIL("أضف رابط تسجيل أو ارفع ملفًا صوتيًا.");

  try {
    await setFatwaAudio(id, {
      url,
      label: text(formData, "audio_label"),
      duration: text(formData, "audio_duration"),
      path: storagePath,
    });
  } catch (error) {
    return failure(error);
  }

  // حذف الملف القديم بعد نجاح الاستبدال حتى لا يتراكم في المخزن.
  if (storagePath && fatwa.audio_path && fatwa.audio_path !== storagePath) {
    const supabase = await createClient();
    await supabase.storage.from(AUDIO_BUCKET).remove([fatwa.audio_path]);
  }

  revalidatePath("/admin/audio");
  revalidatePath(`/fatwas/${fatwa.number}`);
  return OK("تم حفظ التسجيل الصوتي.");
}

export async function removeAudioAction(formData: FormData): Promise<void> {
  await guard();
  const id = int(formData, "id");
  const fatwa = await getFatwaById(id);

  if (fatwa?.audio_path) {
    const supabase = await createClient();
    await supabase.storage.from(AUDIO_BUCKET).remove([fatwa.audio_path]);
  }
  await clearFatwaAudio(id);

  revalidatePath("/admin/audio");
  if (fatwa) revalidatePath(`/fatwas/${fatwa.number}`);
  redirect("/admin/audio?removed=1");
}

/* --------------------------------- المؤلفات -------------------------------- */

function readBookForm(formData: FormData) {
  return {
    title: text(formData, "title"),
    description: text(formData, "description"),
    year: text(formData, "year"),
    publisher: text(formData, "publisher"),
    volumes: text(formData, "volumes"),
    link_url: text(formData, "link_url"),
    sort_order: int(formData, "sort_order"),
  };
}

export async function createBookAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const input = readBookForm(formData);
  if (!input.title) return FAIL("اسم الكتاب مطلوب.");

  try {
    await createBook(input);
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/books");
  revalidatePath("/books");
  return OK("تمت إضافة الكتاب.");
}

export async function updateBookAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const input = readBookForm(formData);
  if (!input.title) return FAIL("اسم الكتاب مطلوب.");

  try {
    await updateBook(int(formData, "id"), input);
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/books");
  revalidatePath("/books");
  return OK("تم حفظ الكتاب.");
}

export async function deleteBookAction(formData: FormData): Promise<void> {
  await guard();
  await deleteBook(int(formData, "id"));
  revalidatePath("/admin/books");
  revalidatePath("/books");
  redirect("/admin/books?deleted=1");
}

/* ------------------------------- نبذة الشيخ ------------------------------- */

const SETTING_KEYS = [
  "site_title",
  "site_tagline",
  "sheikh_name",
  "sheikh_short_bio",
  "sheikh_full_bio",
  "sheikh_image_url",
  "content_disclaimer",
  "contact_email",
];

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const values: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value.trim();
  }
  if (!values.sheikh_name) return FAIL("اسم الشيخ مطلوب.");

  try {
    await saveSettings(values);
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/", "layout");
  return OK("تم حفظ نبذة الشيخ وإعدادات الموقع.");
}

/* --------------------------- أرقام وروابط الفتاوى -------------------------- */

export async function updateFatwaLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = int(formData, "id");
  const current = await getFatwaById(id);
  if (!current) return FAIL("الفتوى غير موجودة.");

  const number = int(formData, "number");
  const slug = text(formData, "slug") || current.slug;

  if (!Number.isInteger(number) || number <= 0)
    return FAIL("رقم الفتوى يجب أن يكون عددًا صحيحًا موجبًا.");
  if (await isFatwaNumberTaken(number, id)) return FAIL(`رقم الفتوى ${number} مستخدم في فتوى أخرى.`);
  if (await isFatwaSlugTaken(slug, id)) return FAIL("رابط الفتوى مستخدم في فتوى أخرى.");

  try {
    await updateFatwa(id, {
      number,
      slug,
      title: current.title,
      question: current.question,
      answer: current.answer,
      category_id: current.category_id,
      audio_url: current.audio_url,
      audio_label: current.audio_label,
      audio_duration: current.audio_duration,
      source: current.source,
      tags: current.tags,
      published: current.published,
    });
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/links");
  revalidatePath(`/fatwas/${number}`);
  revalidatePath("/fatwas");
  return OK(`تم تحديث رقم/رابط الفتوى إلى ${number}.`);
}
