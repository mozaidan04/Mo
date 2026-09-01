"use client";

import { useState } from "react";
import { useSavedFatwas } from "@/lib/saved-client";

type Props = {
  number: number;
  title: string;
  question: string;
  answer: string;
  /** المسار المستقل للفتوى، مثل: /fatwas/1001 */
  path: string;
};

type Flash = { key: string; message: string } | null;

export default function FatwaActions({ number, title, question, answer, path }: Props) {
  const { isSaved, toggle, ready } = useSavedFatwas();
  const [flash, setFlash] = useState<Flash>(null);

  const absoluteUrl = () =>
    typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();

  const announce = (key: string, message: string) => {
    setFlash({ key, message });
    window.setTimeout(() => setFlash(null), 2200);
  };

  const copyText = async (text: string, key: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      announce(key, message);
    } catch {
      announce(key, "تعذّر النسخ، انسخ النص يدويًا.");
    }
  };

  const onCopy = () =>
    copyText(
      [
        `فتوى رقم ${number} — ${title}`,
        "",
        `السؤال: ${question}`,
        "",
        `الإجابة: ${answer}`,
        "",
        absoluteUrl(),
      ].join("\n"),
      "copy",
      "تم نسخ الفتوى",
    );

  const onShare = async () => {
    const url = absoluteUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `فتوى رقم ${number} — ${title}`, url });
        return;
      } catch {
        // المستخدم ألغى المشاركة، أو المتصفح رفضها — ننتقل إلى نسخ الرابط.
      }
    }
    await copyText(url, "share", "تم نسخ رابط الفتوى");
  };

  const saved = ready && isSaved(number);

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          toggle(number);
          announce("save", saved ? "أُزيلت من المحفوظات" : "حُفظت في صفحتك");
        }}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
          saved
            ? "border-primary bg-primary text-white"
            : "border-line bg-surface hover:border-primary hover:text-primary"
        }`}
      >
        <span aria-hidden>{saved ? "★" : "☆"}</span>
        {saved ? "محفوظة" : "حفظ"}
      </button>

      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
      >
        <span aria-hidden>↗</span> مشاركة
      </button>

      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
      >
        <span aria-hidden>⧉</span> نسخ
      </button>

      <span role="status" aria-live="polite" className="text-sm text-primary">
        {flash?.message}
      </span>
    </div>
  );
}
