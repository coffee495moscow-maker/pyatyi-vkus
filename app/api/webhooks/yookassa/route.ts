import { NextResponse } from "next/server";
import { pool } from "@/lib/db/pool";
import { getPaymentProvider } from "@/lib/payments";

type PendingOrder = {
  id: string;
  user_id: string;
  status: string;
  total_kopecks: number;
  points_redeemed: number;
};

/**
 * ЮKassa calls this on payment.succeeded / payment.canceled. The notification
 * body is used only for its payment id: payment state is re-fetched from
 * ЮKassa. Every resulting state change and its loyalty side effects share one
 * DB transaction, so a failed request can be retried safely.
 */
export async function POST(request: Request) {
  let paymentId: string | undefined;

  try {
    const body = await request.json();
    paymentId = body?.object?.id;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (typeof paymentId !== "string" || paymentId.length === 0) {
    return NextResponse.json({ error: "missing_payment_id" }, { status: 400 });
  }

  // Reject unknown and already-terminal payment ids before making an
  // authenticated request to YooKassa. This makes the public endpoint cheap
  // to abuse and also avoids reprocessing completed orders.
  const { rows: candidates } = await pool.query<Pick<PendingOrder, "id">>(
    "select id from orders where payment_id = $1 and status = 'awaiting_payment'",
    [paymentId],
  );
  const candidate = candidates[0];
  if (!candidate) return NextResponse.json({ ok: true });

  let statusResult;
  try {
    statusResult = await getPaymentProvider().fetchPaymentStatus(paymentId);
  } catch (err) {
    console.error("yookassa webhook: fetchPaymentStatus failed", err);
    return NextResponse.json({ error: "status_fetch_failed" }, { status: 500 });
  }

  if (statusResult.status === "pending") return NextResponse.json({ ok: true });
  if (statusResult.orderId !== candidate.id) {
    console.error("yookassa webhook: payment metadata does not match order", {
      paymentId,
      orderId: candidate.id,
    });
    return NextResponse.json({ error: "payment_order_mismatch" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    const { rows } = await client.query<PendingOrder>(
      `select id, user_id, status, total_kopecks, points_redeemed
       from orders where payment_id = $1 for update`,
      [paymentId],
    );
    const order = rows[0];
    if (!order || order.status !== "awaiting_payment") {
      await client.query("commit");
      return NextResponse.json({ ok: true });
    }

    if (statusResult.status === "succeeded") {
      await client.query(
        `update orders set status = 'paid', payment_status = 'succeeded'
         where id = $1 and status = 'awaiting_payment'`,
        [order.id],
      );

      const earnedPoints = Math.floor(order.total_kopecks / 1000); // 1 point per 10₽
      if (earnedPoints > 0) {
        await client.query(
          `insert into loyalty_ledger (user_id, order_id, delta_points, reason)
           values ($1, $2, $3, 'earn_purchase') on conflict do nothing`,
          [order.user_id, order.id, earnedPoints],
        );
      }
      await client.query("select check_and_award_badges($1)", [order.user_id]);
    } else {
      await client.query(
        `update orders set status = 'cancelled', payment_status = 'canceled'
         where id = $1 and status = 'awaiting_payment'`,
        [order.id],
      );

      if (order.points_redeemed > 0) {
        await client.query(
          `insert into loyalty_ledger (user_id, order_id, delta_points, reason)
           values ($1, $2, $3, 'reversal') on conflict do nothing`,
          [order.user_id, order.id, order.points_redeemed],
        );
      }
    }

    await client.query("commit");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("rollback");
    console.error("yookassa webhook: transaction failed", err);
    return NextResponse.json({ error: "order_update_failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
