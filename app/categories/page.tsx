import type { Metadata } from "next";
import Link from "next/link";
import { listCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تصنيفات الفتاوى",
  description: "تصفّح الفتاوى حسب الأبواب الفقهية.",
};

export default function CategoriesPage() {
  const categories = listCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">🗂️ تصنيف الفتاوى</h1>
      <p className="mt-2 text-muted">اختر بابًا لتصفّح فتاواه.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="rounded-2xl border border-line bg-surface p-5 transition hover:border-primary"
          >
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">{category.icon || "📁"}</span>
              <h2 className="text-lg font-bold">{category.name}</h2>
            </div>
            {category.description ? (
              <p className="mt-2 text-sm leading-7 text-muted">{category.description}</p>
            ) : null}
            <p className="mt-3 text-sm font-semibold text-primary">{category.fatwa_count} فتوى</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
