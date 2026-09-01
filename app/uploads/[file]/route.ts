import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { audioMimeType, isSafeUploadName, uploadsDir } from "@/lib/uploads";

/**
 * تقديم التسجيلات الصوتية المرفوعة من لوحة التحكم،
 * مع دعم طلبات النطاق (Range) ليعمل التنقّل داخل المقطع.
 */
export async function GET(request: Request, ctx: RouteContext<"/uploads/[file]">) {
  const { file } = await ctx.params;
  const name = decodeURIComponent(file);
  if (!isSafeUploadName(name)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(uploadsDir(), name);
  let stats: import("node:fs").Stats;
  try {
    stats = await fsp.stat(filePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!stats.isFile()) return new Response("Not found", { status: 404 });

  const contentType = audioMimeType(path.extname(name));
  const range = request.headers.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;

  if (match) {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : stats.size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stats.size) {
      return new Response("Range not satisfiable", {
        status: 416,
        headers: { "content-range": `bytes */${stats.size}` },
      });
    }
    const safeEnd = Math.min(end, stats.size - 1);
    const stream = Readable.toWeb(
      fs.createReadStream(filePath, { start, end: safeEnd }),
    ) as ReadableStream;

    return new Response(stream, {
      status: 206,
      headers: {
        "content-type": contentType,
        "content-length": String(safeEnd - start + 1),
        "content-range": `bytes ${start}-${safeEnd}/${stats.size}`,
        "accept-ranges": "bytes",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  const stream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "content-type": contentType,
      "content-length": String(stats.size),
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
