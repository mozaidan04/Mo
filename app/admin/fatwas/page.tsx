import Link from "next/link";
import DeleteButton from "@/components/admin/delete-button";
import Pagination from "@/components/pagination";
import { requireAdmin } from "@/lib/auth";
import { countFatwas, listFatwas } from "@/lib/data";
import { deleteFatwaAction } from "../actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function AdminFatwasPage(props: PageProps<"/admin/fatwas">) {
  await requireAdmin();
  const searchParams = await props.searchParams;

  const pick = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const search = (pick("search") ?? "").trim();
  const page = Math.max(1, Number(pick("page")) || 1);
  const [total, fatwas] = await Promise.all([
    countFatwas({ includeUnpublished: true, search }),
    listFatwas({ includeUnpublished: true, search, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const buildHref = (p: number) =>
    `/admin/fatwas?page=${p}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">📄 الفتاوى ({total})</h2>
        <Link
          href="/admin/fatwas/new"
          className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-strong"
        >
          + إضافة فتوى
        </Link>
      </div>

      {pick("saved") ? (
        <p className="rounded-xl bg-primary-soft p-3 text-sm font-semibold text-primary">
          تم حفظ الفتوى رقم {pick("saved")}.
        </p>
      ) : null}
      {pick("deleted") ? (
        <p className="rounded-xl bg-surface-muted p-3 text-sm">تم حذف الفتوى.</p>
      ) : null}

      <form className="flex gap-2" action="/admin/fatwas">
        <input
          name="search"
          defaultValue={search}
          placeholder="ابحث بالعنوان أو نص السؤال أو رقم الفتوى"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-primary"
        />
        <button type="submit" className="rounded-xl border border-line px-4 py-2.5 font-semibold hover:border-primary">
          بحث
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface-muted text-right">
            <tr>
              <th className="p-3 font-semibold">الرقم</th>
              <th className="p-3 font-semibold">العنوان</th>
              <th className="p-3 font-semibold">التصنيف</th>
              <th className="p-3 font-semibold">الحالة</th>
              <th className="p-3 font-semibold">صوت</th>
              <th className="p-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {fatwas.map((fatwa) => (
              <tr key={fatwa.id}>
                <td className="p-3 font-bold text-primary">{fatwa.number}</td>
                <td className="p-3">
                  <Link href={`/admin/fatwas/${fatwa.id}`} className="font-semibold hover:text-primary">
                    {fatwa.title}
                  </Link>
                </td>
                <td className="p-3 text-muted">{fatwa.category_name ?? "—"}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      fatwa.published ? "bg-primary-soft text-primary" : "bg-surface-muted text-muted"
                    }`}
                  >
                    {fatwa.published ? "منشورة" : "مسودة"}
                  </span>
                </td>
                <td className="p-3">{fatwa.audio_url ? "🎧" : "—"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/fatwas/${fatwa.number}`}
                      className="rounded-lg border border-line px-3 py-2 text-sm hover:border-primary"
                    >
                      معاينة
                    </Link>
                    <Link
                      href={`/admin/fatwas/${fatwa.id}`}
                      className="rounded-lg border border-line px-3 py-2 text-sm hover:border-primary"
                    >
                      تعديل
                    </Link>
                    <DeleteButton
                      action={deleteFatwaAction}
                      id={fatwa.id}
                      confirmMessage={`حذف الفتوى رقم ${fatwa.number}؟ لا يمكن التراجع.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fatwas.length === 0 ? <p className="text-muted">لا توجد نتائج.</p> : null}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
