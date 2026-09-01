import type { Metadata } from "next";
import Link from "next/link";
import SearchBox from "@/components/search-box";
import FatwaCard from "@/components/fatwa-card";
import { isAiSearchEnabled, searchFatwas } from "@/lib/ai-search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "البحث في الفتاوى",
  description: "ابحث في الفتاوى بالذكاء الاصطناعي أو بالمطابقة النصية.",
};

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const raw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const query = (raw ?? "").trim();
  const results = query ? await searchFatwas(query) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">🔎 البحث بالذكاء الاصطناعي</h1>
      <p className="mt-2 text-muted">
        اكتب سؤالك كما تنطقه، ويبحث النظام عن أقرب الفتاوى في المكتبة.
      </p>

      <div className="mt-6">
        <SearchBox initialQuery={query} aiEnabled={isAiSearchEnabled()} autoFocus={!query} />
      </div>

      {!query ? null : (
        <section className="mt-10">
          {results?.notice ? (
            <p className="mb-4 rounded-2xl border border-line bg-surface-muted p-4 text-sm text-muted">
              {results.notice}
            </p>
          ) : null}

          {results?.summary ? (
            <div className="mb-6 rounded-2xl border border-primary/30 bg-primary-soft p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
                <span aria-hidden>✨</span> خلاصة ما ورد في الفتاوى المختارة
              </h2>
              <p className="leading-8">{results.summary}</p>
              <p className="mt-3 text-xs text-muted">
                هذا الملخص مولَّد آليًا من نصوص الفتاوى أدناه، والمرجع هو نص الفتوى نفسه.
              </p>
            </div>
          ) : null}

          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-bold">
              نتائج البحث عن: <span className="text-primary">{query}</span>
            </h2>
            <span className="text-sm text-muted">{results?.hits.length ?? 0} نتيجة</span>
          </div>

          <div className="grid gap-4">
            {results?.hits.map((hit) => (
              <FatwaCard key={hit.fatwa.id} fatwa={hit.fatwa} reason={hit.reason} />
            ))}
          </div>

          {results && results.hits.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-6">
              <p className="font-semibold">لم نجد فتوى مطابقة لسؤالك.</p>
              <p className="mt-2 text-sm text-muted">
                جرّب صياغة أخرى أو كلمات أقل، أو تصفّح{" "}
                <Link href="/categories" className="text-primary hover:underline">
                  التصنيفات
                </Link>
                .
              </p>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
