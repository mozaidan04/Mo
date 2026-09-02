import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getStats, listFatwas } from "@/lib/data";
import { isAiSearchEnabled } from "@/lib/ai-search";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const [stats, recent] = await Promise.all([
    getStats(),
    listFatwas({ includeUnpublished: true, limit: 5 }),
  ]);

  const cards = [
    { label: "إجمالي الفتاوى", value: stats.fatwas, href: "/admin/fatwas" },
    { label: "فتاوى منشورة", value: stats.published, href: "/admin/fatwas" },
    { label: "فتاوى بتسجيل صوتي", value: stats.withAudio, href: "/admin/audio" },
    { label: "التصنيفات", value: stats.categories, href: "/admin/categories" },
    { label: "المؤلفات", value: stats.books, href: "/admin/books" },
    { label: "إجمالي المشاهدات", value: stats.views, href: "/admin/fatwas" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-line bg-surface p-5 transition hover:border-primary"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-primary">{card.value}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">آخر الفتاوى</h2>
          <Link href="/admin/fatwas/new" className="text-sm font-semibold text-primary hover:underline">
            + إضافة فتوى
          </Link>
        </div>
        <ul className="divide-y divide-line">
          {recent.map((fatwa) => (
            <li key={fatwa.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="min-w-0">
                <span className="ms-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                  {fatwa.number}
                </span>
                <Link href={`/admin/fatwas/${fatwa.id}`} className="font-semibold hover:text-primary">
                  {fatwa.title}
                </Link>
              </span>
              <span className="text-xs text-muted">
                {fatwa.published ? "منشورة" : "مسودة"} · {fatwa.audio_url ? "🎧" : "بدون صوت"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 text-sm">
        <h2 className="text-lg font-bold">حالة البحث الذكي</h2>
        <p className="mt-2 text-muted">
          {isAiSearchEnabled()
            ? "✅ البحث بالذكاء الاصطناعي مفعّل (مفتاح ANTHROPIC_API_KEY موجود)."
            : "ℹ️ البحث الذكي غير مفعّل — أضف ANTHROPIC_API_KEY إلى ملف البيئة. البحث النصي يعمل في كل الأحوال."}
        </p>
      </section>
    </div>
  );
}
