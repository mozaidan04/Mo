import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "مكتبة فتاوى الشيخ مصطفى العدوي",
    template: "%s | مكتبة فتاوى الشيخ مصطفى العدوي",
  },
  description:
    "مكتبة فتاوى الشيخ مصطفى العدوي: بحث ذكي، تصنيفات، تسجيلات صوتية، ورقم ورابط مستقل لكل فتوى.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
