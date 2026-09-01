"use client";

import { useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** صندوق الرابط المستقل للفتوى مع زر نسخ. */
export default function PermalinkBox({ path }: { path: string }) {
  // الأصل غير معروف على الخادم، فنقرأه بعد الترطيب دون setState داخل effect.
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
  const url = origin ? new URL(path, origin).toString() : path;
  const [copied, setCopied] = useState(false);

  return (
    <div className="no-print rounded-2xl border border-line bg-surface-muted p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden>🔗</span> الرابط المستقل لهذه الفتوى
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={url}
          aria-label="الرابط المستقل للفتوى"
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm"
          dir="ltr"
        />
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
          className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
        >
          {copied ? "تم النسخ ✓" : "نسخ الرابط"}
        </button>
      </div>
    </div>
  );
}
