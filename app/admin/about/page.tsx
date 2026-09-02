import AdminForm from "@/components/admin/admin-form";
import { Field, Panel, TextArea } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { saveSettingsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">👨‍🏫 نبذة الشيخ وإعدادات الموقع</h2>
        <p className="mt-1 text-sm text-muted">
          هذه النصوص تظهر في صفحة «عن الشيخ» وفي ترويسة الموقع وتذييله.
        </p>
      </div>

      <Panel title="التعريف بالشيخ">
        <AdminForm action={saveSettingsAction} submitLabel="حفظ البيانات">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الشيخ" name="sheikh_name" required defaultValue={settings.sheikh_name} />
            <Field
              label="رابط صورة الشيخ"
              name="sheikh_image_url"
              dir="ltr"
              defaultValue={settings.sheikh_image_url}
              hint="اختياري — رابط صورة مباشرة"
            />
          </div>

          <TextArea
            label="تعريف مختصر"
            name="sheikh_short_bio"
            rows={3}
            defaultValue={settings.sheikh_short_bio}
            hint="سطران أو ثلاثة يظهران في الصفحة الرئيسية"
          />

          <TextArea
            label="التعريف الكامل"
            name="sheikh_full_bio"
            rows={10}
            defaultValue={settings.sheikh_full_bio}
            hint="يظهر في صفحة «عن الشيخ». يمكن الفصل بين الفقرات بسطر فارغ."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان الموقع" name="site_title" defaultValue={settings.site_title} />
            <Field label="الوصف المختصر للموقع" name="site_tagline" defaultValue={settings.site_tagline} />
          </div>

          <TextArea
            label="تنويه المحتوى"
            name="content_disclaimer"
            rows={3}
            defaultValue={settings.content_disclaimer}
            hint="يظهر أسفل كل فتوى وفي تذييل الموقع"
          />

          <Field label="بريد التواصل" name="contact_email" dir="ltr" defaultValue={settings.contact_email} />
        </AdminForm>
      </Panel>
    </div>
  );
}
