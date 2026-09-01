/**
 * أدوات معالجة النص العربي: تطبيع الحروف وإزالة التشكيل
 * لجعل البحث يتجاهل الفروق الإملائية الشائعة.
 */

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

const ARABIC_INDIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

/** تحويل الأرقام العربية والفارسية إلى أرقام لاتينية. */
export function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => ARABIC_INDIC_DIGITS[d] ?? d);
}

/**
 * تطبيع النص العربي: إزالة التشكيل والتطويل وتوحيد الألف والياء والتاء المربوطة.
 * يُستخدم لبناء فهرس البحث ولمعالجة استعلام المستخدم بنفس الطريقة.
 */
export function normalizeArabic(input: string): string {
  if (!input) return "";
  return normalizeDigits(input)
    .replace(TASHKEEL, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[‌‍‎‏]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** كلمات وظيفية لا تفيد في البحث. */
const STOP_WORDS = new Set([
  "من", "في", "علي", "عن", "الي", "هل", "ما", "ماذا", "هو", "هي", "ان", "انه",
  "التي", "الذي", "مع", "او", "و", "ثم", "قد", "لا", "لم", "لن", "كان", "كانت",
  "يجوز", "حكم", "ايه", "هذا", "هذه", "ذلك", "بين", "كل", "بعد", "قبل", "عند",
  "له", "لها", "به", "بها", "اذا", "حتي", "كما", "غير", "شيء", "شي",
]);

/** تقطيع الاستعلام إلى كلمات مفيدة بعد التطبيع. */
export function tokenize(input: string, keepStopWords = false): string[] {
  const words = normalizeArabic(input).split(" ").filter(Boolean);
  const useful = keepStopWords ? words : words.filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return useful.length > 0 ? useful : words;
}

/** اقتطاع نص طويل مع إضافة علامة الحذف. */
export function truncate(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s\S*$/, "") + "…";
}

/** توليد نص رابط (slug) عربي صالح للاستخدام في المسارات. */
export function slugify(input: string, fallback = "fatwa"): string {
  const slug = normalizeArabic(input).split(" ").filter(Boolean).slice(0, 8).join("-");
  return slug || fallback;
}
