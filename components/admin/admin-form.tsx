"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { ActionState } from "@/app/admin/actions";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  encType?: string;
};

const INITIAL: ActionState = { ok: false, message: "" };

/** نموذج لوحة التحكم: يعرض حالة الحفظ ورسائل الخطأ القادمة من الخادم. */
export default function AdminForm({ action, children, submitLabel, className, encType }: Props) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form action={formAction} encType={encType} className={className ?? "space-y-4"}>
      {children}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50"
        >
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </button>

        {state.message ? (
          <p
            role="status"
            className={`text-sm font-semibold ${state.ok ? "text-primary" : "text-danger"}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
