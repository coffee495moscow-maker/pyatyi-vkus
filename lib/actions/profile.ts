"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { getSession } from "@/lib/session";

export type ProfileActionState = { error: string | null };

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getSession();
  if (!user) redirect("/login?redirect=/profile/edit");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  try {
    await pool.query("update users set full_name = $1, phone = $2 where id = $3", [
      fullName || null,
      phone || null,
      user.id,
    ]);
  } catch {
    return { error: "Не удалось сохранить изменения." };
  }

  revalidatePath("/profile");
  redirect("/profile");
}
