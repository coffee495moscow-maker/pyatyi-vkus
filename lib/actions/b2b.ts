"use server";

import { createClient } from "@/lib/supabase/server";

export type B2bActionState = { error: string | null; success: boolean };

export async function submitB2bInquiry(
  _prevState: B2bActionState,
  formData: FormData,
): Promise<B2bActionState> {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!companyName || !contactName || !phone) {
    return { error: "Заполните название компании, имя и телефон.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("b2b_inquiries").insert({
    company_name: companyName,
    contact_name: contactName,
    phone,
    email: email || null,
    message: message || null,
  });

  if (error) {
    return { error: "Не удалось отправить заявку. Попробуйте позже.", success: false };
  }

  return { error: null, success: true };
}
