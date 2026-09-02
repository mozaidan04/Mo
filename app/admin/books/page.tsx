import AdminForm from "@/components/admin/admin-form";
import DeleteButton from "@/components/admin/delete-button";
import { Field, Panel, TextArea } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { listBooks } from "@/lib/data";
import { createBookAction, deleteBookAction, updateBookAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  await requireAdmin();
  const books = await listBooks();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">📚 إدارة مؤلفات الشيخ</h2>

      <Panel title="إضافة مؤلَّف جديد">
        <AdminForm action={createBookAction} submitLabel="إضافة الكتاب">
          <Field label="اسم الكتاب" name="title" required />
          <TextArea label="نبذة عن الكتاب" name="description" rows={3} />
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="الناشر" name="publisher" />
            <Field label="سنة النشر" name="year" />
            <Field label="عدد الأجزاء" name="volumes" />
            <Field label="الترتيب" name="sort_order" type="number" defaultValue={books.length} />
          </div>
          <Field label="رابط الكتاب" name="link_url" dir="ltr" hint="رابط خارجي للتحميل أو للاطلاع (اختياري)" />
        </AdminForm>
      </Panel>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">المؤلفات الحالية ({books.length})</h3>
        {books.map((book) => (
          <div key={book.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold">{book.title}</h4>
              <DeleteButton
                action={deleteBookAction}
                id={book.id}
                confirmMessage={`حذف الكتاب «${book.title}»؟`}
              />
            </div>

            <AdminForm action={updateBookAction} submitLabel="حفظ">
              <input type="hidden" name="id" value={book.id} />
              <Field label="اسم الكتاب" name="title" required defaultValue={book.title} />
              <TextArea label="النبذة" name="description" rows={3} defaultValue={book.description} />
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="الناشر" name="publisher" defaultValue={book.publisher} />
                <Field label="سنة النشر" name="year" defaultValue={book.year} />
                <Field label="عدد الأجزاء" name="volumes" defaultValue={book.volumes} />
                <Field label="الترتيب" name="sort_order" type="number" defaultValue={book.sort_order} />
              </div>
              <Field label="رابط الكتاب" name="link_url" dir="ltr" defaultValue={book.link_url} />
            </AdminForm>
          </div>
        ))}
      </div>
    </div>
  );
}
