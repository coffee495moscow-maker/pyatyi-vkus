// Supabase Edge Function: send-push
//
// Single place that actually sends Web Push notifications. Invoked by two
// Postgres Database Webhooks (configured in the Supabase dashboard/CLI, not
// in application code — see supabase/functions/send-push/README.md):
//   1. orders   UPDATE OF status  -> notify that order's owner
//   2. promotions UPDATE OF is_active (false -> true) -> broadcast to everyone
//
// Deliberately kept out of the Next.js/Vercel runtime: broadcast sends can
// exceed a typical serverless function's time budget, and this keeps the
// VAPID private key out of the Vercel environment entirely.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:coffee495moscow@gmail.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ORDER_STATUS_MESSAGES: Record<string, string> = {
  paid: "Оплата получена — начинаем готовить ваш заказ.",
  preparing: "Ваш заказ готовится.",
  ready: "Заказ готов к выдаче!",
  completed: "Заказ выдан. Спасибо, что выбрали «Пятый вкус»!",
  cancelled: "Заказ отменён.",
};

interface DbWebhookPayload {
  type: "UPDATE";
  table: "orders" | "promotions";
  record: Record<string, unknown>;
  old_record: Record<string, unknown>;
}

async function sendToSubscription(
  subscription: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url: string },
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await admin.from("push_subscriptions").delete().eq("id", subscription.id);
    } else {
      console.error("push send failed", subscription.id, err);
    }
  }
}

Deno.serve(async (req) => {
  const payload: DbWebhookPayload = await req.json();

  if (payload.table === "orders") {
    const status = payload.record.status as string;
    const oldStatus = payload.old_record?.status as string | undefined;
    if (status === oldStatus) return new Response("ok");

    const message = ORDER_STATUS_MESSAGES[status];
    if (!message) return new Response("ok");

    const userId = payload.record.user_id as string;
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    await Promise.all(
      (subs ?? []).map((s) =>
        sendToSubscription(s, {
          title: "Пятый вкус",
          body: message,
          url: "/profile/orders",
        }),
      ),
    );
  }

  if (payload.table === "promotions") {
    const isActive = payload.record.is_active as boolean;
    const wasActive = payload.old_record?.is_active as boolean | undefined;
    if (!isActive || wasActive) return new Response("ok");

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    const title = (payload.record.title as string) ?? "Новая акция";

    await Promise.all(
      (subs ?? []).map((s) =>
        sendToSubscription(s, { title: "Пятый вкус", body: title, url: "/" }),
      ),
    );
  }

  return new Response("ok");
});
