"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  initialQuery?: string;
  aiEnabled: boolean;
  autoFocus?: boolean;
};

const EXAMPLES = [
  "هل أقضي الصيام عن أمي؟",
  "نسيت التشهد الأول",
  "زكاة الذهب الملبوس",
  "فوائد البنوك",
];

export default function SearchBox({ initialQuery = "", aiEnabled, autoFocus }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [pending, setPending] = useState(false);

  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    setPending(true);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
        className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-sm sm:flex-row"
      >
        <label htmlFor="q" className="sr-only">
          ابحث في الفتاوى
        </label>
        <input
          id="q"
          name="q"
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="اكتب سؤالك بلغتك… أو رقم الفتوى"
          className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={pending || !query.trim()}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50"
        >
          {pending ? "جارٍ البحث…" : "بحث"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary">
          {aiEnabled ? "🔎 بحث بالذكاء الاصطناعي" : "🔎 بحث نصي"}
        </span>
        <span>جرّب:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setQuery(example);
              submit(example);
            }}
            className="rounded-full border border-line px-3 py-1 transition hover:border-primary hover:text-primary"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
