import type { OrderStatus } from "@/lib/db/types";

const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  created: [],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransitionOrder(current: string, next: string): boolean {
  return (TRANSITIONS[current as OrderStatus] ?? []).includes(next as OrderStatus);
}
