"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db/pool";
import { getSession } from "@/lib/session";
import { getPaymentProvider } from "@/lib/payments";

export type CheckoutActionState = { error: string | null };

export async function checkout(
  _prevState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const user = await getSession();
  if (!user) {
    redirect("/login?redirect=/checkout");
  }

  let items: { productId: string; quantity: number }[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Корзина повреждена. Обновите страницу." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Корзина пуста." };
  }

  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const pickupNote = String(formData.get("pickupNote") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const pointsToRedeem = Math.max(
    0,
    Math.floor(Number(formData.get("pointsToRedeem") ?? 0)) || 0,
  );

  if (!contactPhone) {
    return { error: "Укажите телефон для связи." };
  }

  const cartItemsJson = JSON.stringify(
    items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
  );

  let orderId: string;
  let totalKopecks: number;
  try {
    const { rows } = await pool.query<{ create_order: string }>(
      `select create_order($1, $2::jsonb, $3, $4, $5, $6, $7) as create_order`,
      [
        user.id,
        cartItemsJson,
        "pickup",
        pickupNote || null,
        contactPhone,
        comment || null,
        pointsToRedeem,
      ],
    );
    orderId = rows[0].create_order;

    const { rows: orderRows } = await pool.query<{ total_kopecks: number }>(
      "select total_kopecks from orders where id = $1",
      [orderId],
    );
    totalKopecks = orderRows[0].total_kopecks;
  } catch {
    return {
      error:
        "Не удалось оформить заказ — возможно, часть товаров уже недоступна. Обновите корзину и попробуйте снова.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const provider = getPaymentProvider();
    const payment = await provider.createPayment({
      orderId,
      amountKopecks: totalKopecks,
      description: `Заказ №${orderId.slice(0, 8)} — Пятый вкус`,
      returnUrl: `${siteUrl}/checkout/confirmation/${orderId}`,
    });

    const { rowCount } = await pool.query(
      `update orders
       set status = 'awaiting_payment', payment_provider = 'yookassa',
           payment_id = $1, payment_status = 'pending'
       where id = $2 and user_id = $3 and status = 'created'`,
      [payment.paymentId, orderId, user.id],
    );

    if (rowCount === 0) {
      return { error: "Заказ создан, но не удалось открыть оплату. Свяжитесь с нами." };
    }

    redirect(payment.redirectUrl);
  } catch (err) {
    if (err instanceof Error && err.message.includes("YOOKASSA")) {
      return {
        error:
          "Приём оплаты картой временно недоступен (не настроен платёжный провайдер). Свяжитесь с нами, чтобы оформить заказ вручную.",
      };
    }
    throw err;
  }
}
