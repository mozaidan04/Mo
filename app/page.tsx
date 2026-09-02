import Link from "next/link";
import SearchBox from "@/components/search-box";
import FatwaCard from "@/components/fatwa-card";
import { listCategories, listFatwas, getSettings, getStats, listBooks } from "@/lib/data";
import { isAiSearchEnabled } from "@/lib/ai-search";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, categories, latest, stats, allBooks] = await Promise.all([
    getSettings(),
    listCategories(),
    listFatwas({ limit: 6 }),
    getStats(),
    listBooks(),
  ]);
  const books = allBooks.slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-10">
        <p className="text-sm font-semibold text-accent">{settings.sheikh_name}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
          {settings.site_title}
        </h1>
        <p className="mt-3 max-w-2xl leading-8 text-muted">{settings.site_tagline}</p>

        <div className="mt-6">
          <SearchBox aiEnabled={isAiSearchEnabled()} />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "فتوى منشورة", value: stats.published },
            { label: "تصنيفًا", value: stats.categories },
            { label: "فتوى مسجّلة صوتيًا", value: stats.withAudio },
            { label: "مؤلَّفًا", value: stats.books },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-surface-muted px-4 py-3">
              <dt className="text-xs text-muted">{item.label}</dt>
              <dd className="text-2xl font-bold text-primary">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">🗂️ تصنيف الفتاوى</h2>
          <Link href="/categories" className="text-sm font-semibold text-primary hover:underline">
            كل التصنيفات ←
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 9).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-primary"
            >
              <span aria-hidden className="text-2xl">{category.icon || "📁"}</span>
              <span>
                <span className="block font-bold">{category.name}</span>
                <span className="block text-xs text-muted">{category.fatwa_count} فتوى</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">أحدث الفتاوى</h2>
          <Link href="/fatwas" className="text-sm font-semibold text-primary hover:underline">
            كل الفتاوى ←
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {latest.map((fatwa) => (
            <FatwaCard key={fatwa.id} fatwa={fatwa} />
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-xl font-bold">👨‍🏫 نبذة عن الشيخ</h2>
          <p className="mt-3 leading-8 text-muted">{settings.sheikh_short_bio}</p>
          <Link href="/sheikh" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            التعريف الكامل ←
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-xl font-bold">📚 من مؤلفات الشيخ</h2>
          <ul className="mt-3 space-y-2 text-muted">
            {books.map((book) => (
              <li key={book.id} className="leading-7">• {book.title}</li>
            ))}
          </ul>
          <Link href="/books" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            كل المؤلفات ←
          </Link>
        </div>
      </section>
    </div>
  );
}
