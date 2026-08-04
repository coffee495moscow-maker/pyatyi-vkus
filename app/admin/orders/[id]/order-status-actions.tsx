"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/actions/admin/orders";
import { Button } from "@/components/ui/button";

const TRANSITIONS: Record<string, { status: string; label: string }[]> = {
  paid: [
    { status: "preparing", label: "Начать готовить" },
    { status: "cancelled", label: "Отменить" },
  ],
  preparing: [{ status: "ready", label: "Готов к выдаче" }],
  ready: [{ status: "completed", label: "Отметить выданным" }],
};

export function OrderStatusActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const options = TRANSITIONS[currentStatus] ?? [];

  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.status}
          variant={option.status === "cancelled" ? "danger" : "primary"}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateOrderStatus(orderId, option.status);
              router.refresh();
            })
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
