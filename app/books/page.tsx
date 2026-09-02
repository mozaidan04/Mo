import type { Metadata } from "next";
import { getSettings, listBooks } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مؤلفات الشيخ",
  description: "قائمة بأسماء كتب ومؤلفات الشيخ مصطفى العدوي.",
};

export default async function BooksPage() {
  const [books, settings] = await Promise.all([listBooks(), getSettings()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">📚 مؤلفات الشيخ</h1>
      <p className="mt-2 text-muted">أسماء الكتب والمؤلفات المنسوبة إلى {settings.sheikh_name}.</p>

      <ol className="mt-8 space-y-4">
        {books.map((book, index) => (
          <li key={book.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft font-bold text-primary"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold">{book.title}</h2>
                {book.description ? (
                  <p className="mt-1 leading-7 text-muted">{book.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                  {book.publisher ? <span>الناشر: {book.publisher}</span> : null}
                  {book.year ? <span>سنة النشر: {book.year}</span> : null}
                  {book.volumes ? <span>عدد الأجزاء: {book.volumes}</span> : null}
                </div>
                {book.link_url ? (
                  <a
                    href={book.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    رابط الكتاب ↗
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {books.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-6 text-muted">
          لم تُضف مؤلفات بعد.
        </p>
      ) : null}
    </div>
  );
}
