import "server-only";
import path from "node:path";

/**
 * مجلد الملفات المرفوعة (التسجيلات الصوتية).
 * لا يوضع داخل public لأن Next يقدّم محتوى public كما كان وقت البناء،
 * فالملفات المرفوعة لاحقًا تُقدَّم عبر المسار /uploads/[file].
 */
export function uploadsDir(): string {
  const configured = process.env.UPLOADS_DIR;
  return configured
    ? path.resolve(/* turbopackIgnore: true */ process.cwd(), configured)
    : path.join(process.cwd(), "data", "uploads");
}

const AUDIO_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".wav": "audio/wav",
  ".aac": "audio/aac",
  ".webm": "audio/webm",
};

export const ALLOWED_AUDIO_EXTENSIONS = Object.keys(AUDIO_MIME);

export function audioMimeType(extension: string): string {
  return AUDIO_MIME[extension.toLowerCase()] ?? "application/octet-stream";
}

/** اسم ملف آمن: بلا مسارات فرعية وبامتداد مسموح. */
export function isSafeUploadName(name: string): boolean {
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) return false;
  return ALLOWED_AUDIO_EXTENSIONS.includes(path.extname(name).toLowerCase());
}
