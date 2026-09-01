import { NextResponse } from "next/server";
import { getFatwasByNumbers } from "@/lib/data";

/**
 * جلب فتاوى بأرقامها — تستخدمه صفحة "الفتاوى المحفوظة"
 * لأن قائمة المحفوظات مخزّنة في متصفح الزائر.
 * مثال: /api/fatwas?numbers=1001,1004
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const numbers = (searchParams.get("numbers") ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, 200);

  if (numbers.length === 0) return NextResponse.json({ fatwas: [] });

  const found = getFatwasByNumbers(numbers);
  // الحفاظ على ترتيب المستخدم (الأحدث حفظًا أولًا).
  const byNumber = new Map(found.map((f) => [f.number, f]));
  const ordered = numbers.map((n) => byNumber.get(n)).filter(Boolean);

  return NextResponse.json({ fatwas: ordered });
}
