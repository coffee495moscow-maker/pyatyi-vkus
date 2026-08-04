import "server-only";
import type { PaymentProvider } from "./provider";
import { YooKassaProvider } from "./yookassa";

/**
 * Provider selection via PAYMENT_PROVIDER env var. To add another provider
 * (e.g. CloudPayments): implement PaymentProvider in lib/payments/<name>.ts
 * and add a branch here — no call-site changes needed elsewhere.
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? "yookassa";

  switch (provider) {
    case "yookassa":
      return new YooKassaProvider();
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`);
  }
}
