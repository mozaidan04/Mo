import type { Metadata } from "next";
import Link from "next/link";
import { getSettings, listBooks, getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نبذة عن الشيخ",
  description: "تعريف مختصر بالشيخ مصطفى العدوي.",
};

export default async function SheikhPage() {
  const [settings, books, stats] = await Promise.all([getSettings(), listBooks(), getStats()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">👨‍🏫 نبذة عن الشيخ</h1>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {settings.sheikh_image_url ? (
            // صورة يضبطها المشرف من لوحة التحكم، وقد تكون من نطاق خارجي.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.sheikh_image_url}
              alt={settings.sheikh_name ?? "صورة الشيخ"}
              className="h-28 w-28 rounded-2xl object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-primary-soft text-4xl"
            >
              📖
            </span>
          )}
          <div>
            <h2 className="text-2xl font-bold">{settings.sheikh_name}</h2>
            <p className="mt-2 leading-8 text-muted">{settings.sheikh_short_bio}</p>
          </div>
        </div>

        <div className="prose-arabic mt-6 border-t border-line pt-6">
          {settings.sheikh_full_bio}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "فتوى في المكتبة", value: stats.published },
          { label: "تصنيفًا", value: stats.categories },
          { label: "مؤلَّفًا", value: books.length },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-primary">{item.value}</p>
            <p className="text-xs text-muted">{item.label}</p>
          </div>
        ))}
      </section>

      <Link
        href="/books"
        className="mt-8 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-strong"
      >
        📚 تصفّح مؤلفات الشيخ
      </Link>
    </div>
  );
}
