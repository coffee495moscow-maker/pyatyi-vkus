"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publishPromotion,
  deactivatePromotion,
} from "@/lib/actions/admin/promotions";
import { Button } from "@/components/ui/button";

export function PromotionActions({
  promotionId,
  isActive,
}: {
  promotionId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant={isActive ? "outline" : "primary"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (isActive) {
            await deactivatePromotion(promotionId);
          } else {
            await publishPromotion(promotionId);
          }
          router.refresh();
        })
      }
    >
      {isActive ? "Снять с публикации" : "Опубликовать"}
    </Button>
  );
}
