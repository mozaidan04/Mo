import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "fatawa_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 ساعة

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "fatawa-development-secret"
  );
}

function adminPassword(): string {
  // في بيئة التطوير فقط تُستخدم كلمة مرور افتراضية.
  return process.env.ADMIN_PASSWORD || "admin";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** التحقق من كلمة مرور لوحة التحكم. */
export function verifyPassword(password: string): boolean {
  return safeEqual(password, adminPassword());
}

/** قيمة الكوكي: تاريخ الانتهاء + توقيع HMAC. */
function buildToken(): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;
  return Number(expiresAt) > Date.now();
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, buildToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(COOKIE_NAME)?.value);
}

/** يُستخدم في كل صفحة وإجراء داخل /admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}

/** هل ما زالت كلمة المرور الافتراضية مستخدمة؟ لعرض تحذير في اللوحة. */
export function isUsingDefaultPassword(): boolean {
  return !process.env.ADMIN_PASSWORD;
}
