import type { Metadata } from "next";
import FatwaCard from "@/components/fatwa-card";
import Pagination from "@/components/pagination";
import { countFatwas, listFatwas } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "كل الفتاوى",
  description: "تصفّح جميع فتاوى المكتبة مرتبة برقم الفتوى.",
};

const PER_PAGE = 12;

export default async function FatwasPage(props: PageProps<"/fatwas">) {
  const searchParams = await props.searchParams;
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const total = countFatwas();
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const fatwas = listFatwas({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">كل الفتاوى</h1>
      <p className="mt-2 text-muted">{total} فتوى منشورة، لكل فتوى رقم ورابط مستقل.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {fatwas.map((fatwa) => (
          <FatwaCard key={fatwa.id} fatwa={fatwa} />
        ))}
      </div>

      {fatwas.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-6 text-muted">
          لا توجد فتاوى منشورة بعد.
        </p>
      ) : null}

      <Pagination page={page} totalPages={totalPages} buildHref={(p) => `/fatwas?page=${p}`} />
    </div>
  );
}
