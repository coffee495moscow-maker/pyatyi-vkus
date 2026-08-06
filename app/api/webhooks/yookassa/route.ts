import { NextResponse } from "next/server";
import { pool } from "@/lib/db/pool";
import { getPaymentProvider } from "@/lib/payments";

/**
 * ЮKassa calls this on payment.succeeded / payment.canceled. We never trust
 * the webhook body's status — instead we re-fetch the payment from ЮKassa's
 * API by id, which is authoritative and avoids needing to verify webhook
 * signatures/IP ranges. Idempotent: a repeat notification for an
 * already-processed order is a no-op.
 */
export async function POST(request: Request) {
  let paymentId: string | undefined;

  try {
    const body = await request.json();
    paymentId = body?.object?.id;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!paymentId) {
    return NextResponse.json({ error: "missing_payment_id" }, { status: 400 });
  }

  let statusResult;
  try {
    const provider = getPaymentProvider();
    statusResult = await provider.fetchPaymentStatus(paymentId);
  } catch (err) {
    console.error("yookassa webhook: fetchPaymentStatus failed", err);
    return NextResponse.json({ error: "status_fetch_failed" }, { status: 500 });
  }

  const { rows } = await pool.query<{
    id: string;
    user_id: string;
    status: string;
    total_kopecks: number;
    points_redeemed: number;
  }>(
    "select id, user_id, status, total_kopecks, points_redeemed from orders where payment_id = $1",
    [paymentId],
  );
  const order = rows[0];

  if (!order) {
    console.warn("yookassa webhook: no matching order for payment", paymentId);
    return NextResponse.json({ ok: true });
  }

  // Idempotency — a terminal state was already applied for this order.
  if (order.status === "paid" || order.status === "cancelled" || order.status === "completed") {
    return NextResponse.json({ ok: true });
  }

  try {
    if (statusResult.status === "succeeded") {
      const { rowCount } = await pool.query(
        "update orders set status = 'paid', payment_status = 'succeeded' where id = $1 and status = 'awaiting_payment'",
        [order.id],
      );

      if (rowCount === 0) {
        return NextResponse.json({ ok: true }); // already transitioned by a concurrent webhook
      }

      const earnedPoints = Math.floor(order.total_kopecks / 1000); // 1 point per 10₽
      if (earnedPoints > 0) {
        await pool.query(
          "insert into loyalty_ledger (user_id, order_id, delta_points, reason) values ($1, $2, $3, 'earn_purchase')",
          [order.user_id, order.id, earnedPoints],
        );
      }

      await pool.query("select check_and_award_badges($1)", [order.user_id]);
    } else if (statusResult.status === "canceled") {
      await pool.query(
        "update orders set status = 'cancelled', payment_status = 'canceled' where id = $1 and status = 'awaiting_payment'",
        [order.id],
      );

      if (order.points_redeemed > 0) {
        await pool.query(
          "insert into loyalty_ledger (user_id, order_id, delta_points, reason) values ($1, $2, $3, 'reversal')",
          [order.user_id, order.id, order.points_redeemed],
        );
      }
    }
  } catch (err) {
    console.error("yookassa webhook: order update failed", err);
    return NextResponse.json({ error: "order_update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
