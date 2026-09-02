import Link from "next/link";
import AdminForm from "@/components/admin/admin-form";
import DeleteButton from "@/components/admin/delete-button";
import { Field } from "@/components/admin/fields";
import Pagination from "@/components/pagination";
import { requireAdmin } from "@/lib/auth";
import { countFatwas, listFatwas } from "@/lib/data";
import { removeAudioAction, saveAudioAction } from "../actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

export default async function AdminAudioPage(props: PageProps<"/admin/audio">) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">🎧 إدارة التسجيلات الصوتية</h2>
        <p className="mt-1 text-sm text-muted">
          اربط كل فتوى بتسجيل صوتي — إما برابط مباشر أو برفع ملف إلى الخادم.
        </p>
      </div>

      {pick("removed") ? (
        <p className="rounded-xl bg-surface-muted p-3 text-sm">تم حذف التسجيل من الفتوى.</p>
      ) : null}

      <form className="flex gap-2" action="/admin/audio">
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

      <div className="space-y-4">
        {fatwas.map((fatwa) => (
          <div key={fatwa.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">
                <span className="ms-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
                  {fatwa.number}
                </span>
                <Link href={`/admin/fatwas/${fatwa.id}`} className="hover:text-primary">
                  {fatwa.title}
                </Link>
              </h3>
              {fatwa.audio_url ? (
                <DeleteButton
                  action={removeAudioAction}
                  id={fatwa.id}
                  label="حذف التسجيل"
                  confirmMessage={`حذف التسجيل الصوتي من الفتوى رقم ${fatwa.number}؟`}
                />
              ) : (
                <span className="text-xs text-muted">لا يوجد تسجيل</span>
              )}
            </div>

            {fatwa.audio_url ? (
              <div className="mb-4">
                  <audio controls preload="none" src={fatwa.audio_url} />
                <p className="mt-1 break-all text-xs text-muted" dir="ltr">
                  {fatwa.audio_url}
                </p>
              </div>
            ) : null}

            <AdminForm
              action={saveAudioAction}
              submitLabel={fatwa.audio_url ? "تحديث التسجيل" : "حفظ التسجيل"}
              encType="multipart/form-data"
            >
              <input type="hidden" name="id" value={fatwa.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="رابط التسجيل"
                  name="audio_url"
                  dir="ltr"
                  defaultValue={fatwa.audio_url}
                  hint="رابط مباشر لملف صوتي (mp3 مثلًا)"
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">أو ارفع ملفًا صوتيًا</span>
                  <input
                    type="file"
                    name="audio_file"
                    accept="audio/*"
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-primary"
                  />
                  <span className="mt-1 block text-xs text-muted">
                    الحد الأقصى 60 ميجابايت. الملف المرفوع يلغي الرابط المكتوب.
                  </span>
                </label>
                <Field label="عنوان التسجيل" name="audio_label" defaultValue={fatwa.audio_label} />
                <Field label="المدة" name="audio_duration" defaultValue={fatwa.audio_duration} placeholder="4:32" />
              </div>
            </AdminForm>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
        buildHref={(p) => `/admin/audio?page=${p}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
      />
    </div>
  );
}
