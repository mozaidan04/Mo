import type { Metadata } from "next";
import SavedFatwas from "@/components/saved-fatwas";

export const metadata: Metadata = {
  title: "صفحتي — الفتاوى المحفوظة",
  description: "الفتاوى التي حفظتها للرجوع إليها لاحقًا.",
};

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">👤 صفحتي</h1>
      <p className="mt-2 text-muted">
        الفتاوى المحفوظة على هذا الجهاز. الحفظ يتم في متصفحك ولا يحتاج تسجيل دخول.
      </p>
      <SavedFatwas />
    </div>
  );
}
