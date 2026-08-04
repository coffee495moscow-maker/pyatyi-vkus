"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";

export type CheckoutActionState = { error: string | null };

export async function checkout(
  _prevState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data: orderId, error: orderError } = await supabase.rpc("create_order", {
    p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    p_fulfillment_type: "pickup",
    p_pickup_note: pickupNote || null,
    p_contact_phone: contactPhone,
    p_comment: comment || null,
    p_points_to_redeem: pointsToRedeem,
  });

  if (orderError || !orderId) {
    return {
      error:
        "Не удалось оформить заказ — возможно, часть товаров уже недоступна. Обновите корзину и попробуйте снова.",
    };
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("total_kopecks")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { error: "Заказ создан, но не удалось перейти к оплате. Свяжитесь с нами." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const provider = getPaymentProvider();
    const payment = await provider.createPayment({
      orderId,
      amountKopecks: order.total_kopecks,
      description: `Заказ №${orderId.slice(0, 8)} — Пятый вкус`,
      returnUrl: `${siteUrl}/checkout/confirmation/${orderId}`,
    });

    const { error: attachError } = await supabase.rpc("attach_payment", {
      p_order_id: orderId,
      p_provider: "yookassa",
      p_payment_id: payment.paymentId,
    });

    if (attachError) {
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
