import { notFound } from "next/navigation";
import Link from "next/link";
import FatwaCard from "@/components/fatwa-card";
import Pagination from "@/components/pagination";
import { countFatwas, getCategoryBySlug, listFatwas } from "@/lib/data";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

export async function generateMetadata(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "تصنيف غير موجود" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, Number(rawPage) || 1);
  const [total, fatwas] = await Promise.all([
    countFatwas({ categorySlug: slug }),
    listFatwas({ categorySlug: slug, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/categories" className="text-sm text-muted hover:text-primary">
        ← كل التصنيفات
      </Link>

      <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold">
        <span aria-hidden>{category.icon || "📁"}</span>
        {category.name}
      </h1>
      {category.description ? <p className="mt-2 text-muted">{category.description}</p> : null}
      <p className="mt-1 text-sm text-muted">{total} فتوى</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {fatwas.map((fatwa) => (
          <FatwaCard key={fatwa.id} fatwa={fatwa} />
        ))}
      </div>

      {fatwas.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-6 text-muted">
          لا توجد فتاوى في هذا التصنيف بعد.
        </p>
      ) : null}

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => `/categories/${slug}?page=${p}`}
      />
    </div>
  );
}
