import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listSavedFatwas } from "@/lib/data";
import { truncate } from "@/lib/arabic";
import { clearSavedAction, removeSavedAction } from "@/app/saved-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "محفوظاتي",
  description: "الفتاوى التي حفظتها في حسابك للرجوع إليها لاحقًا.",
};

export default async function SavedPage() {
  const user = await requireUser("/saved");
  const fatwas = await listSavedFatwas();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">👤 صفحتي</h1>
      <p className="mt-2 text-muted">
        الفتاوى المحفوظة في حسابك <span dir="ltr">({user.email})</span> — تظهر على أي جهاز تدخل منه.
      </p>

      {fatwas.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <p className="font-semibold">لا توجد فتاوى محفوظة بعد.</p>
          <p className="mt-2 text-sm text-muted">افتح أي فتوى واضغط زر «حفظ» لتظهر هنا.</p>
          <Link
            href="/fatwas"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-strong"
          >
            تصفّح الفتاوى
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted">{fatwas.length} فتوى محفوظة</p>
            <form action={clearSavedAction}>
              <button
                type="submit"
                className="rounded-lg border border-line px-3 py-2 text-sm text-danger transition hover:border-danger"
              >
                مسح الكل
              </button>
            </form>
          </div>

          <ul className="grid gap-4">
            {fatwas.map((fatwa) => (
              <li key={fatwa.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary-soft px-3 py-1 font-bold text-primary">
                    فتوى رقم {fatwa.number}
                  </span>
                  {fatwa.category_name ? (
                    <span className="rounded-full border border-line px-3 py-1 text-muted">
                      {fatwa.category_name}
                    </span>
                  ) : null}
                  {fatwa.audio_url ? (
                    <span className="rounded-full border border-line px-3 py-1 text-muted">🎧</span>
                  ) : null}
                </div>

                <h2 className="mt-2 text-lg font-bold">
                  <Link href={`/fatwas/${fatwa.number}`} className="hover:text-primary">
                    {fatwa.title}
                  </Link>
                </h2>
                <p className="mt-1 text-sm leading-7 text-muted">{truncate(fatwa.question, 160)}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/fatwas/${fatwa.number}`}
                    className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                  >
                    فتح الفتوى
                  </Link>
                  <form action={removeSavedAction}>
                    <input type="hidden" name="fatwa_id" value={fatwa.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-line px-3 py-2 text-sm text-danger transition hover:border-danger"
                    >
                      إزالة من المحفوظات
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
