import Link from "next/link";
import { getAllPromotions } from "@/lib/queries/admin";
import { Button } from "@/components/ui/button";
import { PromotionActions } from "./promotion-actions";

export default async function AdminPromotionsPage() {
  const promotions = await getAllPromotions();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Акции</h1>
        <Link href="/admin/promotions/new">
          <Button>Новая акция</Button>
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {promotions.map((promo) => (
          <div key={promo.id} className="flex items-center gap-3 bg-surface px-4 py-3">
            <div className="flex-1">
              <p className="font-medium">{promo.title}</p>
              <p className="text-xs text-text-muted">
                {promo.is_active ? "Опубликована" : "Черновик"}
              </p>
            </div>
            <PromotionActions promotionId={promo.id} isActive={promo.is_active} />
          </div>
        ))}
        {promotions.length === 0 && (
          <p className="bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Пока нет акций.
          </p>
        )}
      </div>
    </div>
  );
}
