"use server";

import { pool } from "@/lib/db/pool";

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

  try {
    await pool.query(
      `insert into b2b_inquiries (company_name, contact_name, phone, email, message)
       values ($1, $2, $3, $4, $5)`,
      [companyName, contactName, phone, email || null, message || null],
    );
  } catch {
    return { error: "Не удалось отправить заявку. Попробуйте позже.", success: false };
  }

  return { error: null, success: true };
}
