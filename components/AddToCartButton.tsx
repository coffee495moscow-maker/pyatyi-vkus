"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  productId,
  slug,
  name,
  priceKopecks,
  className,
  compact = false,
}: {
  productId: string;
  slug: string;
  name: string;
  priceKopecks: number;
  className?: string;
  compact?: boolean;
}) {
  const add = useCartStore((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    add({ productId, slug, name, priceKopecks });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        aria-label="Добавить в корзину"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-contrast transition-transform active:scale-90",
          className,
        )}
      >
        {justAdded ? <Check size={18} /> : <Plus size={18} />}
      </button>
    );
  }

  return (
    <Button onClick={handleAdd} className={className}>
      {justAdded ? "Добавлено" : "Добавить в корзину"}
    </Button>
  );
}
