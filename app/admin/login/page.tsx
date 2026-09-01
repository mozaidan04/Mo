import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminForm from "@/components/admin/admin-form";
import { Field } from "@/components/admin/fields";
import { isAdmin } from "@/lib/auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "دخول لوحة التحكم" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-2xl font-bold">⚙️ دخول لوحة التحكم</h1>
        <p className="mt-2 text-sm text-muted">
          أدخل كلمة المرور المضبوطة في متغير البيئة <code className="font-mono">ADMIN_PASSWORD</code>.
        </p>

        <div className="mt-6">
          <AdminForm action={loginAction} submitLabel="دخول">
            <Field label="كلمة المرور" name="password" type="password" required dir="ltr" />
          </AdminForm>
        </div>
      </div>
    </div>
  );
}
