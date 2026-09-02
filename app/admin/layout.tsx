import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { signOutAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "لوحة التحكم", icon: "📊" },
  { href: "/admin/fatwas", label: "الفتاوى", icon: "📄" },
  { href: "/admin/categories", label: "التصنيفات", icon: "🗂️" },
  { href: "/admin/audio", label: "التسجيلات الصوتية", icon: "🎧" },
  { href: "/admin/books", label: "مؤلفات الشيخ", icon: "📚" },
  { href: "/admin/about", label: "نبذة الشيخ", icon: "👨‍🏫" },
  { href: "/admin/links", label: "أرقام وروابط الفتاوى", icon: "🔗" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [user, admin] = await Promise.all([getCurrentUser(), isAdmin()]);
  // صفحة «لا صلاحية» تستخدم هذا التخطيط أيضًا، فتُعرض دون القائمة الجانبية.
  if (!admin) return <>{children}</>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">⚙️ إدارة المكتبة</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted" dir="ltr">
            {user?.email}
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-line px-3 py-2 text-sm transition hover:border-danger hover:text-danger"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <nav className="h-fit rounded-2xl border border-line bg-surface p-2 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition hover:bg-primary-soft hover:text-primary"
            >
              <span aria-hidden>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            className="mt-2 flex items-center gap-2 rounded-xl border-t border-line px-3 py-2.5 text-muted transition hover:text-primary"
          >
            <span aria-hidden>↩</span> عودة إلى الموقع
          </Link>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
