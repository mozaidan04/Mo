import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, assertSupabaseEnv } from "./config";

/**
 * عميل Supabase على الخادم مربوط بجلسة الزائر عبر الكوكيز،
 * فتُطبَّق سياسات RLS بهوية المستخدم الحالي (أو بهوية زائر مجهول).
 */
export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // مكوّنات الخادم لا تسمح بكتابة الكوكيز؛ تجديد الجلسة يتم في proxy.ts
        }
      },
    },
  });
}
