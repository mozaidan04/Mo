import Link from "next/link";
import FatwaForm from "@/components/admin/fatwa-form";
import { requireAdmin } from "@/lib/auth";
import { listCategories, nextFatwaNumber } from "@/lib/data";
import { createFatwaAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewFatwaPage() {
  await requireAdmin();
  const [categories, suggestedNumber] = await Promise.all([listCategories(), nextFatwaNumber()]);

  return (
    <div className="space-y-5">
      <Link href="/admin/fatwas" className="text-sm text-muted hover:text-primary">
        ← عودة إلى قائمة الفتاوى
      </Link>
      <h2 className="text-xl font-bold">إضافة فتوى جديدة</h2>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <FatwaForm
          action={createFatwaAction}
          categories={categories}
          suggestedNumber={suggestedNumber}
          submitLabel="حفظ الفتوى"
        />
      </div>
    </div>
  );
}
