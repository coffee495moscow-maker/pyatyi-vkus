"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleProductAvailability } from "@/lib/actions/admin/products";
import { cn } from "@/lib/utils";

export function AvailabilityToggle({
  productId,
  isAvailable,
}: {
  productId: string;
  isAvailable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleProductAvailability(productId, !isAvailable);
          router.refresh();
        })
      }
      className={cn(
        "pill border px-3 py-1 text-xs font-medium",
        isAvailable
          ? "border-success/50 text-success"
          : "border-border text-text-muted",
      )}
    >
      {isAvailable ? "В продаже" : "Скрыт"}
    </button>
  );
}
