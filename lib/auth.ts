import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

/** المستخدم الحالي أو null. يُتحقَّق من الرمز مع خادم Supabase وليس من الكوكي وحده. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

/**
 * هل المستخدم الحالي مشرف؟
 * المصدر الوحيد للحقيقة هو جدول admins في قاعدة البيانات،
 * لأن سياسات RLS هي ما يحمي الكتابة فعليًا — وقائمة البُرد غير مقروءة لغير المشرفين.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
});

/** يُستدعى في كل صفحة داخل /admin. */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fadmin");
  if (!(await isAdmin())) redirect("/admin/no-access");
  return user;
}

/** يُستدعى في الصفحات التي تتطلب حسابًا (مثل الفتاوى المحفوظة). */
export async function requireUser(nextPath: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** الاسم المعروض للمستخدم في الترويسة. */
export function displayName(user: User): string {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email ?? "حسابي";
}
