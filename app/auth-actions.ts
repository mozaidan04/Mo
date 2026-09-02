"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { ok: boolean; message: string };

const FAIL = (message: string): AuthState => ({ ok: false, message });

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  // نقبل المسارات الداخلية فقط حتى لا يُستخدم الرابط لتحويل الزائر إلى موقع آخر.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return { email, password, next: safeNext };
}

/** ترجمة رسائل Supabase الإنجليزية الشائعة إلى العربية. */
function translateError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "البريد أو كلمة المرور غير صحيحة.";
  if (lower.includes("email not confirmed")) return "لم يُفعَّل الحساب بعد — افتح رسالة التأكيد في بريدك.";
  if (lower.includes("user already registered")) return "هذا البريد مسجَّل بالفعل، سجّل الدخول بدل إنشاء حساب.";
  if (lower.includes("password should be at least")) return "كلمة المرور قصيرة — استخدم ٦ أحرف فأكثر.";
  if (lower.includes("rate limit") || lower.includes("too many")) return "محاولات كثيرة، انتظر قليلًا ثم أعد المحاولة.";
  if (lower.includes("signups not allowed")) return "التسجيل مغلق حاليًا في إعدادات الموقع.";
  return `تعذّر إتمام العملية: ${message}`;
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  if (!email || !password) return FAIL("أدخل البريد وكلمة المرور.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return FAIL(translateError(error.message));

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  if (!email || !password) return FAIL("أدخل البريد وكلمة المرور.");
  if (password.length < 6) return FAIL("كلمة المرور قصيرة — استخدم ٦ أحرف فأكثر.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return FAIL(translateError(error.message));

  // إن كان تأكيد البريد مفعّلًا في إعدادات Supabase فلا تُنشأ جلسة الآن.
  if (!data.session) {
    return {
      ok: true,
      message: "أُنشئ الحساب. افتح رسالة التأكيد في بريدك ثم سجّل الدخول.",
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
