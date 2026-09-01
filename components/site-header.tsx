import Link from "next/link";
import { getSettings } from "@/lib/data";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/categories", label: "التصنيفات" },
  { href: "/fatwas", label: "كل الفتاوى" },
  { href: "/saved", label: "صفحتي" },
  { href: "/sheikh", label: "عن الشيخ" },
  { href: "/books", label: "المؤلفات" },
];

export default function SiteHeader() {
  const settings = getSettings();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-lg text-white"
          >
            ﷽
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold">
              {settings.site_title ?? "مكتبة الفتاوى"}
            </span>
            <span className="block text-xs text-muted">{settings.sheikh_name}</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center justify-end gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-muted transition hover:bg-primary-soft hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="rounded-lg border border-line px-3 py-2 text-muted transition hover:border-primary hover:text-primary"
          >
            لوحة التحكم
          </Link>
        </nav>
      </div>
    </header>
  );
}
