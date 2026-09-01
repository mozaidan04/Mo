import AdminForm from "@/components/admin/admin-form";
import DeleteButton from "@/components/admin/delete-button";
import { Field, Panel, TextArea } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = listCategories();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">🗂️ إدارة التصنيفات</h2>

      <Panel title="إضافة تصنيف جديد">
        <AdminForm action={createCategoryAction} submitLabel="إضافة التصنيف">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم التصنيف" name="name" required />
            <Field label="الرابط (slug)" name="slug" dir="ltr" hint="اتركه فارغًا ليُولَّد تلقائيًا" />
            <Field label="الأيقونة" name="icon" placeholder="مثال: 🕌" />
            <Field label="الترتيب" name="sort_order" type="number" defaultValue={categories.length} />
          </div>
          <TextArea label="وصف التصنيف" name="description" rows={2} />
        </AdminForm>
      </Panel>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">التصنيفات الحالية ({categories.length})</h3>
        {categories.map((category) => (
          <div key={category.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold">
                <span aria-hidden className="ms-2">{category.icon || "📁"}</span>
                {category.name}
                <span className="ms-2 text-xs font-normal text-muted">
                  ({category.fatwa_count} فتوى)
                </span>
              </h4>
              <DeleteButton
                action={deleteCategoryAction}
                id={category.id}
                confirmMessage={`حذف التصنيف «${category.name}»؟ ستبقى فتاواه لكن بدون تصنيف.`}
              />
            </div>

            <AdminForm action={updateCategoryAction} submitLabel="حفظ">
              <input type="hidden" name="id" value={category.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="الاسم" name="name" required defaultValue={category.name} />
                <Field label="الرابط (slug)" name="slug" dir="ltr" defaultValue={category.slug} />
                <Field label="الأيقونة" name="icon" defaultValue={category.icon} />
                <Field label="الترتيب" name="sort_order" type="number" defaultValue={category.sort_order} />
              </div>
              <TextArea label="الوصف" name="description" rows={2} defaultValue={category.description} />
            </AdminForm>
          </div>
        ))}
      </div>
    </div>
  );
}
