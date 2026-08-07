"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db/pool";
import { getSession } from "@/lib/session";
import { getPaymentProvider } from "@/lib/payments";

export type CheckoutActionState = { error: string | null };

async function cancelCreatedOrderAndRestorePoints(orderId: string, userId: string) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ points_redeemed: number; status: string }>(
      `select points_redeemed, status from orders
       where id = $1 and user_id = $2 for update`,
      [orderId, userId],
    );
    const order = rows[0];
    if (!order || order.status !== "created") {
      await client.query("rollback");
      return;
    }

    await client.query(
      `update orders set status = 'cancelled', payment_status = 'initiation_failed'
       where id = $1`,
      [orderId],
    );
    if (order.points_redeemed > 0) {
      await client.query(
        `insert into loyalty_ledger (user_id, order_id, delta_points, reason)
         values ($1, $2, $3, 'reversal') on conflict do nothing`,
        [userId, orderId, order.points_redeemed],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    console.error("checkout: failed to compensate a payment-initiation error", error);
  } finally {
    client.release();
  }
}

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
  const provider = getPaymentProvider();
  let payment;
  try {
    payment = await provider.createPayment({
      orderId,
      amountKopecks: totalKopecks,
      description: `Заказ №${orderId.slice(0, 8)} — Пятый вкус`,
      returnUrl: `${siteUrl}/checkout/confirmation/${orderId}`,
    });
  } catch (error) {
    await cancelCreatedOrderAndRestorePoints(orderId, user.id);
    console.error("checkout: payment creation failed", error);
    return {
      error:
        "Приём оплаты картой временно недоступен. Баллы, если они были списаны, уже возвращены. Попробуйте позже или свяжитесь с нами.",
    };
  }

  try {
    const { rowCount } = await pool.query(
      `update orders
       set status = 'awaiting_payment', payment_provider = 'yookassa',
           payment_id = $1, payment_status = 'pending'
       where id = $2 and user_id = $3 and status = 'created'`,
      [payment.paymentId, orderId, user.id],
    );

    if (rowCount === 0) {
      throw new Error("checkout: could not attach YooKassa payment to a created order");
    }
  } catch (error) {
    try {
      await provider.cancelPayment(payment.paymentId);
    } catch (cancelError) {
      console.error("checkout: payment attachment failed and YooKassa cancellation failed", {
        error,
        cancelError,
        orderId,
        paymentId: payment.paymentId,
      });
      return {
        error:
          "Не удалось открыть оплату. Заказ сохранён для проверки — пожалуйста, свяжитесь с нами, не оформляйте повторный заказ.",
      };
    }

    await cancelCreatedOrderAndRestorePoints(orderId, user.id);
    console.error("checkout: payment attachment failed", error);
    return {
      error:
        "Не удалось открыть оплату. Заказ отменён, а баллы возвращены. Попробуйте оформить заказ ещё раз.",
    };
  }

  redirect(payment.redirectUrl);
}
