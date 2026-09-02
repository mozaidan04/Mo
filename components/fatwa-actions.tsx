"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toggleSaveAction, type SaveState } from "@/app/saved-actions";

type Props = {
  fatwaId: number;
  number: number;
  title: string;
  question: string;
  answer: string;
  /** المسار المستقل للفتوى، مثل: /fatwas/1001 */
  path: string;
  isLoggedIn: boolean;
  initiallySaved: boolean;
};

const buttonClass =
  "inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary";

export default function FatwaActions({
  fatwaId,
  number,
  title,
  question,
  answer,
  path,
  isLoggedIn,
  initiallySaved,
}: Props) {
  const [state, saveAction, savePending] = useActionState<SaveState, FormData>(toggleSaveAction, {
    saved: initiallySaved,
    message: "",
  });
  const [flash, setFlash] = useState("");

  const absoluteUrl = () =>
    typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();

  const announce = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash(""), 2200);
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      announce(message);
    } catch {
      announce("تعذّر النسخ، انسخ النص يدويًا.");
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
      "تم نسخ الفتوى",
    );

  const onShare = async () => {
    const url = absoluteUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `فتوى رقم ${number} — ${title}`, url });
        return;
      } catch {
        // ألغى المستخدم المشاركة أو رفضها المتصفح — ننسخ الرابط بدلًا منها.
      }
    }
    await copyText(url, "تم نسخ رابط الفتوى");
  };

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      {isLoggedIn ? (
        <form action={saveAction}>
          <input type="hidden" name="fatwa_id" value={fatwaId} />
          <input type="hidden" name="path" value={path} />
          <input type="hidden" name="saved" value={state.saved ? "1" : "0"} />
          <button
            type="submit"
            disabled={savePending}
            aria-pressed={state.saved}
            className={
              state.saved
                ? "inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                : `${buttonClass} disabled:opacity-60`
            }
          >
            <span aria-hidden>{state.saved ? "★" : "☆"}</span>
            {savePending ? "لحظة…" : state.saved ? "محفوظة" : "حفظ"}
          </button>
        </form>
      ) : (
        <Link href={`/login?next=${encodeURIComponent(path)}`} className={buttonClass}>
          <span aria-hidden>☆</span> حفظ (يحتاج حسابًا)
        </Link>
      )}

      <button type="button" onClick={onShare} className={buttonClass}>
        <span aria-hidden>↗</span> مشاركة
      </button>

      <button type="button" onClick={onCopy} className={buttonClass}>
        <span aria-hidden>⧉</span> نسخ
      </button>

      <span role="status" aria-live="polite" className="text-sm text-primary">
        {flash || state.message}
      </span>
    </div>
  );
}
