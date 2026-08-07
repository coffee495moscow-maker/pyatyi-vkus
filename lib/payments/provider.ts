export interface CreatePaymentParams {
  orderId: string;
  amountKopecks: number;
  description: string;
  returnUrl: string;
}

export interface CreatePaymentResult {
  redirectUrl: string;
  paymentId: string;
}

export type PaymentStatus = "pending" | "succeeded" | "canceled";

export interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  /** Authoritative re-fetch from the provider — never trust webhook body status directly. */
  fetchPaymentStatus(
    paymentId: string,
  ): Promise<{ status: PaymentStatus; orderId: string | null }>;
  /** Cancels an unconfirmed payment during a local checkout compensation flow. */
  cancelPayment(paymentId: string): Promise<void>;
}
