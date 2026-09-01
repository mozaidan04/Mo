"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "fatawa:saved";
const EVENT = "fatawa:saved-changed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** القيمة الخام المخزّنة — نص ثابت المرجع حتى لا تتكرر عمليات الرسم. */
function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    // التخزين قد يكون معطلًا (تصفح خاص).
    return "";
  }
}

function parse(raw: string): number[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  } catch {
    return [];
  }
}

function write(numbers: number[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
  } catch {
    // نتجاهل تعذّر الكتابة بهدوء.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

/**
 * قائمة الفتاوى المحفوظة على هذا الجهاز.
 * الحفظ محلي في متصفح الزائر ولا يحتاج تسجيل دخول.
 */
export function useSavedFatwas() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const numbers = useMemo(() => parse(raw), [raw]);

  const toggle = useCallback((number: number) => {
    const current = parse(readRaw());
    write(current.includes(number) ? current.filter((n) => n !== number) : [number, ...current]);
  }, []);

  const remove = useCallback((number: number) => {
    write(parse(readRaw()).filter((n) => n !== number));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { numbers, ready, toggle, remove, clear, isSaved: (n: number) => numbers.includes(n) };
}
