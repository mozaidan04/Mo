import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  /** يبني رابط الصفحة، مثال: (p) => `/fatwas?page=${p}` */
  buildHref: (page: number) => string;
};

export default function Pagination({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
  );

  return (
    <nav className="no-print mt-8 flex flex-wrap items-center justify-center gap-2 text-sm" aria-label="تنقل بين الصفحات">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="rounded-lg border border-line px-3 py-2 hover:border-primary">
          السابق
        </Link>
      ) : null}

      {pages.map((p, index) => (
        <span key={p} className="flex items-center gap-2">
          {index > 0 && p - pages[index - 1] > 1 ? <span className="text-muted">…</span> : null}
          <Link
            href={buildHref(p)}
            aria-current={p === page ? "page" : undefined}
            className={`rounded-lg border px-3 py-2 ${
              p === page ? "border-primary bg-primary text-white" : "border-line hover:border-primary"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className="rounded-lg border border-line px-3 py-2 hover:border-primary">
          التالي
        </Link>
      ) : null}
    </nav>
  );
}
