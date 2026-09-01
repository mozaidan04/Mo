"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSavedFatwas } from "@/lib/saved-client";
import { truncate } from "@/lib/arabic";
import type { FatwaWithCategory } from "@/lib/types";

export default function SavedFatwas() {
  const { numbers, ready, remove, clear } = useSavedFatwas();
  const key = numbers.join(",");
  // نحفظ مع النتيجة مفتاح الطلب الذي جاءت منه، فنشتق حالة التحميل بدل ضبطها داخل الـ effect.
  const [data, setData] = useState<{ key: string; fatwas: FatwaWithCategory[] }>({
    key: "",
    fatwas: [],
  });

  useEffect(() => {
    if (!ready || !key) return;

    const controller = new AbortController();
    fetch(`/api/fatwas?numbers=${key}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { fatwas: [] }))
      .then((payload: { fatwas?: FatwaWithCategory[] }) =>
        setData({ key, fatwas: payload.fatwas ?? [] }),
      )
      .catch(() => {
        if (!controller.signal.aborted) setData({ key, fatwas: [] });
      });

    return () => controller.abort();
  }, [key, ready]);

  const fatwas = key ? data.fatwas : [];
  const loading = Boolean(key) && data.key !== key;

  if (!ready) {
    return <p className="mt-8 text-muted">جارٍ تحميل المحفوظات…</p>;
  }

  if (numbers.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <p className="font-semibold">لا توجد فتاوى محفوظة بعد.</p>
        <p className="mt-2 text-sm text-muted">
          افتح أي فتوى واضغط زر «حفظ» لتظهر هنا.
        </p>
        <Link
          href="/fatwas"
          className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-strong"
        >
          تصفّح الفتاوى
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {numbers.length} فتوى محفوظة {loading ? "— جارٍ التحديث…" : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("حذف جميع الفتاوى المحفوظة؟")) clear();
          }}
          className="rounded-lg border border-line px-3 py-2 text-sm text-danger transition hover:border-danger"
        >
          مسح الكل
        </button>
      </div>

      <ul className="grid gap-4">
        {fatwas.map((fatwa) => (
          <li key={fatwa.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-primary-soft px-3 py-1 font-bold text-primary">
                فتوى رقم {fatwa.number}
              </span>
              {fatwa.category_name ? (
                <span className="rounded-full border border-line px-3 py-1 text-muted">
                  {fatwa.category_name}
                </span>
              ) : null}
              {fatwa.audio_url ? (
                <span className="rounded-full border border-line px-3 py-1 text-muted">🎧</span>
              ) : null}
            </div>

            <h2 className="mt-2 text-lg font-bold">
              <Link href={`/fatwas/${fatwa.number}`} className="hover:text-primary">
                {fatwa.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm leading-7 text-muted">{truncate(fatwa.question, 160)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/fatwas/${fatwa.number}`}
                className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
              >
                فتح الفتوى
              </Link>
              <button
                type="button"
                onClick={() => remove(fatwa.number)}
                className="rounded-lg border border-line px-3 py-2 text-sm text-danger transition hover:border-danger"
              >
                إزالة من المحفوظات
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && fatwas.length < numbers.length ? (
        <p className="mt-4 text-sm text-muted">
          بعض الفتاوى المحفوظة لم تعد متاحة (حُذفت أو أُخفيت)، ويمكنك مسح القائمة لتنظيفها.
        </p>
      ) : null}
    </div>
  );
}
