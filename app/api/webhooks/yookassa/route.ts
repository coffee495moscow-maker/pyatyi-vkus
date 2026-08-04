import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const admin = createAdminClient();

  let statusResult;
  try {
    const provider = getPaymentProvider();
    statusResult = await provider.fetchPaymentStatus(paymentId);
  } catch (err) {
    console.error("yookassa webhook: fetchPaymentStatus failed", err);
    return NextResponse.json({ error: "status_fetch_failed" }, { status: 500 });
  }

  const { data: order, error: orderLookupError } = await admin
    .from("orders")
    .select("id, user_id, status, total_kopecks, points_redeemed")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (orderLookupError || !order) {
    console.warn("yookassa webhook: no matching order for payment", paymentId);
    return NextResponse.json({ ok: true });
  }

  // Idempotency — a terminal state was already applied for this order.
  if (order.status === "paid" || order.status === "cancelled" || order.status === "completed") {
    return NextResponse.json({ ok: true });
  }

  if (statusResult.status === "succeeded") {
    const { error: updateError } = await admin
      .from("orders")
      .update({ status: "paid", payment_status: "succeeded" })
      .eq("id", order.id)
      .eq("status", "awaiting_payment");

    if (updateError) {
      console.error("yookassa webhook: order update failed", updateError);
      return NextResponse.json({ error: "order_update_failed" }, { status: 500 });
    }

    const earnedPoints = Math.floor(order.total_kopecks / 1000); // 1 point per 10₽
    if (earnedPoints > 0) {
      await admin.from("loyalty_ledger").insert({
        user_id: order.user_id,
        order_id: order.id,
        delta_points: earnedPoints,
        reason: "earn_purchase",
      });
    }

    await admin.rpc("check_and_award_badges", { p_user_id: order.user_id });

    // Order status change (created -> paid) fires a Postgres Database
    // Webhook (configured in the Supabase dashboard/CLI, not in app code)
    // that invokes the send-push Edge Function — see supabase/functions/send-push.
  } else if (statusResult.status === "canceled") {
    await admin
      .from("orders")
      .update({ status: "cancelled", payment_status: "canceled" })
      .eq("id", order.id)
      .eq("status", "awaiting_payment");

    if (order.points_redeemed > 0) {
      await admin.from("loyalty_ledger").insert({
        user_id: order.user_id,
        order_id: order.id,
        delta_points: order.points_redeemed,
        reason: "reversal",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
