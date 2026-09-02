import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOutAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "لا صلاحية للإدارة" };

export default async function NoAccessPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-3xl border border-line bg-surface p-8">
        <p className="text-4xl" aria-hidden>🔒</p>
        <h1 className="mt-3 text-2xl font-bold">هذه الصفحة للمشرفين</h1>
        <p className="mt-3 leading-8 text-muted">
          حسابك {user?.email ? <span dir="ltr">({user.email})</span> : null} مسجَّل في الموقع،
          لكنه غير مُدرج ضمن المشرفين، فلا يملك صلاحية إدارة المحتوى.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-strong"
          >
            العودة للموقع
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-xl border border-line px-5 py-2.5 font-semibold transition hover:border-danger hover:text-danger"
            >
              الخروج وتسجيل دخول بحساب آخر
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
