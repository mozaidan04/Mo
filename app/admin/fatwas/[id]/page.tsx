import Link from "next/link";
import { notFound } from "next/navigation";
import FatwaForm from "@/components/admin/fatwa-form";
import DeleteButton from "@/components/admin/delete-button";
import { requireAdmin } from "@/lib/auth";
import { getFatwaById, listCategories } from "@/lib/data";
import { deleteFatwaAction, updateFatwaAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditFatwaPage(props: PageProps<"/admin/fatwas/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const [fatwa, categories] = await Promise.all([getFatwaById(Number(id)), listCategories()]);
  if (!fatwa) notFound();

  return (
    <div className="space-y-5">
      <Link href="/admin/fatwas" className="text-sm text-muted hover:text-primary">
        ← عودة إلى قائمة الفتاوى
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">تعديل الفتوى رقم {fatwa.number}</h2>
        <div className="flex gap-2">
          <Link
            href={`/fatwas/${fatwa.number}`}
            className="rounded-lg border border-line px-3 py-2 text-sm hover:border-primary"
          >
            معاينة
          </Link>
          <DeleteButton
            action={deleteFatwaAction}
            id={fatwa.id}
            confirmMessage={`حذف الفتوى رقم ${fatwa.number}؟ لا يمكن التراجع.`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <FatwaForm
          action={updateFatwaAction}
          categories={categories}
          fatwa={fatwa}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </div>
  );
}
