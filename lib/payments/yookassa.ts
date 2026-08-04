import "server-only";
import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatus,
} from "./provider";

const API_BASE = "https://api.yookassa.ru/v3";

function authHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    throw new Error(
      "YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY is not set — the client needs to create a ЮKassa merchant account and provide these.",
    );
  }
  const token = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${token}`;
}

function mapStatus(raw: string): PaymentStatus {
  if (raw === "succeeded") return "succeeded";
  if (raw === "canceled") return "canceled";
  return "pending";
}

export class YooKassaProvider implements PaymentProvider {
  async createPayment({
    orderId,
    amountKopecks,
    description,
    returnUrl,
  }: CreatePaymentParams): Promise<CreatePaymentResult> {
    const response = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        "Idempotence-Key": orderId,
      },
      body: JSON.stringify({
        amount: { value: (amountKopecks / 100).toFixed(2), currency: "RUB" },
        capture: true,
        confirmation: { type: "redirect", return_url: returnUrl },
        description,
        metadata: { order_id: orderId },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `YooKassa createPayment failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = await response.json();
    return { redirectUrl: data.confirmation.confirmation_url, paymentId: data.id };
  }

  async fetchPaymentStatus(paymentId: string) {
    const response = await fetch(`${API_BASE}/payments/${paymentId}`, {
      headers: { Authorization: authHeader() },
    });

    if (!response.ok) {
      throw new Error(`YooKassa fetchPaymentStatus failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      status: mapStatus(data.status),
      orderId: (data.metadata?.order_id as string | undefined) ?? null,
    };
  }
}
