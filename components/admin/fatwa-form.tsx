import AdminForm from "@/components/admin/admin-form";
import { CheckboxField, Field, SelectField, TextArea } from "@/components/admin/fields";
import type { ActionState } from "@/app/admin/actions";
import type { CategoryWithCount, FatwaWithCategory } from "@/lib/types";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  categories: CategoryWithCount[];
  fatwa?: FatwaWithCategory;
  suggestedNumber?: number;
  submitLabel: string;
};

/** نموذج إضافة/تعديل فتوى — يستخدمه المسار /admin/fatwas/new و/admin/fatwas/[id]. */
export default function FatwaForm({ action, categories, fatwa, suggestedNumber, submitLabel }: Props) {
  return (
    <AdminForm action={action} submitLabel={submitLabel} className="space-y-5">
      {fatwa ? <input type="hidden" name="id" value={fatwa.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="رقم الفتوى"
          name="number"
          type="number"
          required
          defaultValue={fatwa?.number ?? suggestedNumber}
          hint="رقم فريد لكل فتوى، وهو أساس الرابط المستقل /fatwas/الرقم"
        />
        <Field
          label="رابط الفتوى (slug)"
          name="slug"
          defaultValue={fatwa?.slug}
          hint="اتركه فارغًا ليُولَّد من العنوان تلقائيًا"
        />
      </div>

      <Field label="عنوان الفتوى" name="title" required defaultValue={fatwa?.title} />

      <TextArea label="السؤال" name="question" required rows={5} defaultValue={fatwa?.question} />

      <TextArea label="الإجابة" name="answer" required rows={12} defaultValue={fatwa?.answer} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="التصنيف"
          name="category_id"
          defaultValue={fatwa?.category_id ?? 0}
          options={[
            { value: 0, label: "— بدون تصنيف —" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <Field
          label="الوسوم"
          name="tags"
          defaultValue={fatwa?.tags}
          hint="افصل بين الوسوم بفاصلة، مثال: الصلاة, السهو"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="رابط التسجيل الصوتي"
          name="audio_url"
          dir="ltr"
          defaultValue={fatwa?.audio_url}
          hint="رابط مباشر لملف صوتي، أو ارفع ملفًا من صفحة التسجيلات"
        />
        <Field label="عنوان التسجيل" name="audio_label" defaultValue={fatwa?.audio_label} />
        <Field label="مدة التسجيل" name="audio_duration" defaultValue={fatwa?.audio_duration} placeholder="مثال: 4:32" />
      </div>

      <Field
        label="المصدر"
        name="source"
        defaultValue={fatwa?.source}
        hint="اسم الدرس أو اللقاء أو الكتاب الذي أُخذت منه الفتوى"
      />

      <CheckboxField
        label="نشر الفتوى"
        name="published"
        defaultChecked={fatwa ? Boolean(fatwa.published) : true}
        hint="الفتاوى غير المنشورة لا تظهر للزوار ولا في نتائج البحث"
      />
    </AdminForm>
  );
}
