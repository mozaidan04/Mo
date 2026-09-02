import { notFound } from "next/navigation";
import Link from "next/link";
import FatwaActions from "@/components/fatwa-actions";
import FatwaCard from "@/components/fatwa-card";
import PermalinkBox from "@/components/permalink-box";
import { getFatwaByNumber, incrementFatwaViews, listFatwas, getSettings, isFatwaSaved } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { truncate } from "@/lib/arabic";

export const dynamic = "force-dynamic";

function parseNumber(raw: string): number | null {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function generateMetadata(props: PageProps<"/fatwas/[number]">) {
  const { number } = await props.params;
  const parsed = parseNumber(number);
  const fatwa = parsed ? await getFatwaByNumber(parsed) : null;
  if (!fatwa) return { title: "فتوى غير موجودة" };

  return {
    title: `فتوى ${fatwa.number}: ${fatwa.title}`,
    description: truncate(fatwa.question, 160),
    alternates: { canonical: `/fatwas/${fatwa.number}` },
    openGraph: {
      title: `فتوى رقم ${fatwa.number} — ${fatwa.title}`,
      description: truncate(fatwa.question, 200),
      type: "article",
    },
  };
}

export default async function FatwaPage(props: PageProps<"/fatwas/[number]">) {
  const { number } = await props.params;
  const parsed = parseNumber(number);
  const fatwa = parsed ? await getFatwaByNumber(parsed) : null;
  if (!fatwa) notFound();

  const user = await getCurrentUser();
  const [settings, relatedAll, saved] = await Promise.all([
    getSettings(),
    listFatwas({ categorySlug: fatwa.category_slug ?? undefined, limit: 5 }),
    user ? isFatwaSaved(fatwa.id) : Promise.resolve(false),
    incrementFatwaViews(fatwa.number),
  ]);
  const related = relatedAll.filter((item) => item.id !== fatwa.id).slice(0, 4);

  const tags = fatwa.tags.split(",").map((t) => t.trim()).filter(Boolean);
  const path = `/fatwas/${fatwa.number}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="no-print mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/fatwas" className="hover:text-primary">كل الفتاوى</Link>
        {fatwa.category_name ? (
          <>
            <span aria-hidden>/</span>
            <Link href={`/categories/${fatwa.category_slug}`} className="hover:text-primary">
              {fatwa.category_name}
            </Link>
          </>
        ) : null}
      </nav>

      <article className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <header className="border-b border-line pb-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-primary px-3 py-1 font-bold text-white">
              فتوى رقم {fatwa.number}
            </span>
            {fatwa.category_name ? (
              <Link
                href={`/categories/${fatwa.category_slug}`}
                className="rounded-full border border-line px-3 py-1 text-muted hover:text-primary"
              >
                {fatwa.category_name}
              </Link>
            ) : null}
            <span className="text-muted">👁 {fatwa.views} مشاهدة</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">{fatwa.title}</h1>
        </header>

        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-primary">
            <span aria-hidden>❓</span> السؤال
          </h2>
          <div className="prose-arabic rounded-2xl bg-surface-muted p-4">{fatwa.question}</div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-primary">
            <span aria-hidden>✅</span> الإجابة
          </h2>
          <div className="prose-arabic">{fatwa.answer}</div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-primary">
            <span aria-hidden>🎧</span> التسجيل الصوتي للإجابة
          </h2>
          {fatwa.audio_url ? (
            <div className="rounded-2xl border border-line bg-surface-muted p-4">
              {fatwa.audio_label ? (
                <p className="mb-2 text-sm font-semibold">{fatwa.audio_label}</p>
              ) : null}
              <audio controls preload="none" src={fatwa.audio_url}>
                متصفحك لا يدعم تشغيل الصوت.
                <a href={fatwa.audio_url}>تحميل التسجيل</a>
              </audio>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                {fatwa.audio_duration ? <span>المدة: {fatwa.audio_duration}</span> : null}
                <a href={fatwa.audio_url} className="hover:text-primary" download>
                  تحميل التسجيل
                </a>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
              لا يوجد تسجيل صوتي مرفق بهذه الفتوى.
            </p>
          )}
        </section>

        <div className="mt-8 border-t border-line pt-5">
          <FatwaActions
            fatwaId={fatwa.id}
            isLoggedIn={Boolean(user)}
            initiallySaved={saved}
            number={fatwa.number}
            title={fatwa.title}
            question={fatwa.question}
            answer={fatwa.answer}
            path={path}
          />
        </div>

        <div className="mt-6">
          <PermalinkBox path={path} />
        </div>

        {tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-primary"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}

        <footer className="mt-6 space-y-1 border-t border-line pt-4 text-xs text-muted">
          {fatwa.source ? <p>المصدر: {fatwa.source}</p> : null}
          <p>آخر تحديث: {fatwa.updated_at}</p>
          {settings.content_disclaimer ? <p>{settings.content_disclaimer}</p> : null}
        </footer>
      </article>

      {related.length > 0 ? (
        <section className="no-print mt-10">
          <h2 className="mb-4 text-xl font-bold">فتاوى ذات صلة</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((item) => (
              <FatwaCard key={item.id} fatwa={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
