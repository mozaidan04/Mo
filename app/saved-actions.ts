"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { clearSavedFatwas, saveFatwa, unsaveFatwa } from "@/lib/data";

export type SaveState = { saved: boolean; message: string };

/**
 * حفظ/إلغاء حفظ فتوى في حساب المستخدم.
 * الحفظ مرتبط بالحساب، فيظهر على كل أجهزة صاحبه.
 */
export async function toggleSaveAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const user = await getCurrentUser();
  const fatwaId = Number(formData.get("fatwa_id"));
  const path = String(formData.get("path") ?? "/");
  const currentlySaved = formData.get("saved") === "1";

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  if (!Number.isInteger(fatwaId) || fatwaId <= 0) {
    return { saved: currentlySaved, message: "فتوى غير صالحة." };
  }

  try {
    if (currentlySaved) {
      await unsaveFatwa(fatwaId);
    } else {
      await saveFatwa(user.id, fatwaId);
    }
  } catch (error) {
    return {
      saved: currentlySaved,
      message: error instanceof Error ? error.message : "تعذّر تنفيذ الطلب.",
    };
  }

  revalidatePath("/saved");
  return {
    saved: !currentlySaved,
    message: currentlySaved ? "أُزيلت من المحفوظات" : "حُفظت في حسابك",
  };
}

export async function removeSavedAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fsaved");

  const fatwaId = Number(formData.get("fatwa_id"));
  if (Number.isInteger(fatwaId) && fatwaId > 0) await unsaveFatwa(fatwaId);

  revalidatePath("/saved");
}

export async function clearSavedAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fsaved");

  await clearSavedFatwas(user.id);
  revalidatePath("/saved");
}
