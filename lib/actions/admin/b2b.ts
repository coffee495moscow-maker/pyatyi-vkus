"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { requireAdmin } from "@/lib/session";

export async function updateB2bInquiryStatus(inquiryId: string, status: string) {
  await requireAdmin();

  try {
    await pool.query("update b2b_inquiries set status = $1 where id = $2", [status, inquiryId]);
  } catch {
    return { error: "Не удалось обновить статус заявки." };
  }

  revalidatePath("/admin/b2b");
  return { error: null };
}
