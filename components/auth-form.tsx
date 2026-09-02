"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction, signUpAction, type AuthState } from "@/app/auth-actions";

const INITIAL: AuthState = { ok: false, message: "" };

/** نموذج الدخول/إنشاء الحساب بالبريد وكلمة المرور. */
export default function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1">
        {(
          [
            ["signin", "تسجيل الدخول"],
            ["signup", "إنشاء حساب"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === value ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">البريد الإلكتروني</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            dir="ltr"
            placeholder="name@example.com"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">كلمة المرور</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            dir="ltr"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-primary"
          />
          {mode === "signup" ? (
            <span className="mt-1 block text-xs text-muted">٦ أحرف فأكثر.</span>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50"
        >
          {pending ? "لحظة…" : mode === "signin" ? "دخول" : "إنشاء الحساب"}
        </button>

        {state.message ? (
          <p
            role="status"
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              state.ok ? "bg-primary-soft text-primary" : "bg-danger/10 text-danger"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        بإنشائك حسابًا فأنت توافق على استخدام بريدك لتسجيل الدخول وحفظ فتاواك فقط.{" "}
        <Link href="/" className="text-primary hover:underline">
          العودة للرئيسية
        </Link>
      </p>
    </div>
  );
}
