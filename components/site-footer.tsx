import Link from "next/link";
import { getSettings } from "@/lib/data";

export default async function SiteFooter() {
  const settings = await getSettings();

  return (
    <footer className="no-print mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <h2 className="mb-2 font-bold">{settings.site_title ?? "مكتبة الفتاوى"}</h2>
          <p className="text-muted">{settings.site_tagline}</p>
        </div>
        <div>
          <h2 className="mb-2 font-bold">روابط</h2>
          <ul className="space-y-1 text-muted">
            <li><Link className="hover:text-primary" href="/categories">تصنيفات الفتاوى</Link></li>
            <li><Link className="hover:text-primary" href="/saved">الفتاوى المحفوظة</Link></li>
            <li><Link className="hover:text-primary" href="/login">حسابي</Link></li>
            <li><Link className="hover:text-primary" href="/sheikh">نبذة عن الشيخ</Link></li>
            <li><Link className="hover:text-primary" href="/books">مؤلفات الشيخ</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-bold">تنويه</h2>
          <p className="text-muted">{settings.content_disclaimer}</p>
          {settings.contact_email ? (
            <p className="mt-2 text-muted">للتواصل: {settings.contact_email}</p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
