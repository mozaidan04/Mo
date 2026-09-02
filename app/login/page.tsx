import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل الدخول لحفظ الفتاوى في حسابك.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const rawNext = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (await getCurrentUser()) redirect(next);

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-line bg-surface p-7 sm:p-8">
        <h1 className="text-2xl font-bold">👤 حسابك في المكتبة</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          الحساب يُستخدم لحفظ الفتاوى والرجوع إليها من أي جهاز.
        </p>

        <div className="mt-6">
          <AuthForm next={next} />
        </div>
      </div>
    </div>
  );
}
