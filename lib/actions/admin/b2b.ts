"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateB2bInquiryStatus(inquiryId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("b2b_inquiries")
    .update({ status })
    .eq("id", inquiryId);

  if (error) return { error: "Не удалось обновить статус заявки." };

  revalidatePath("/admin/b2b");
  return { error: null };
}
