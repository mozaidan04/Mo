import Link from "next/link";
import AdminForm from "@/components/admin/admin-form";
import { Field } from "@/components/admin/fields";
import Pagination from "@/components/pagination";
import { requireAdmin } from "@/lib/auth";
import { countFatwas, listFatwas, nextFatwaNumber } from "@/lib/data";
import { updateFatwaLinkAction } from "../actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 15;

export default async function AdminLinksPage(props: PageProps<"/admin/links">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const pick = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const search = (pick("search") ?? "").trim();
  const page = Math.max(1, Number(pick("page")) || 1);
  const [total, fatwas, suggestedNumber] = await Promise.all([
    countFatwas({ includeUnpublished: true, search }),
    listFatwas({ includeUnpublished: true, search, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    nextFatwaNumber(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">🔗 أرقام وروابط الفتاوى</h2>
        <p className="mt-1 text-sm text-muted">
          لكل فتوى رقم فريد ورابط مستقل على الصورة <code className="font-mono">/fatwas/الرقم</code>،
          ورابط مختصر <code className="font-mono">/f/الرقم</code>. الرقم التالي المقترح:{" "}
          <strong className="text-primary">{suggestedNumber}</strong>
        </p>
      </div>

      <form className="flex gap-2" action="/admin/links">
        <input
          name="search"
          defaultValue={search}
          placeholder="ابحث عن فتوى بالعنوان أو الرقم"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-primary"
        />
        <button type="submit" className="rounded-xl border border-line px-4 py-2.5 font-semibold hover:border-primary">
          بحث
        </button>
      </form>

      <div className="space-y-3">
        {fatwas.map((fatwa) => (
          <div key={fatwa.id} className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="mb-1 font-bold">{fatwa.title}</h3>
            <p className="mb-3 text-xs text-muted" dir="ltr">
              /fatwas/{fatwa.number} · /f/{fatwa.number} · slug: {fatwa.slug}
            </p>

            <AdminForm action={updateFatwaLinkAction} submitLabel="تحديث الرقم والرابط">
              <input type="hidden" name="id" value={fatwa.id} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="رقم الفتوى" name="number" type="number" required defaultValue={fatwa.number} />
                <Field label="الرابط (slug)" name="slug" dir="ltr" defaultValue={fatwa.slug} />
                <div className="flex items-end">
                  <Link
                    href={`/fatwas/${fatwa.number}`}
                    className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:border-primary"
                  >
                    فتح الرابط ↗
                  </Link>
                </div>
              </div>
            </AdminForm>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
        buildHref={(p) => `/admin/links?page=${p}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
      />
    </div>
  );
}
