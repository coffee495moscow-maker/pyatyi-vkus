"use client";

import { useEffect, useState } from "react";
import { getCartRecommendations } from "@/lib/actions/recommendations";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { AddToCartButton } from "@/components/AddToCartButton";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/db/types";

export function CartRecommendations({ productIds }: { productIds: string[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const key = productIds.slice().sort().join(",");

  useEffect(() => {
    let cancelled = false;
    getCartRecommendations(productIds).then((result) => {
      if (!cancelled) setProducts(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="font-display text-lg">Часто заказывают вместе</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <div className="relative aspect-square">
              <ProductPlaceholder
                slug={product.slug}
                categorySlug=""
                name={product.name}
                className="h-full w-full"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1 p-3">
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-text-muted">{formatPrice(product.price_kopecks)}</p>
              <AddToCartButton
                productId={product.id}
                slug={product.slug}
                name={product.name}
                priceKopecks={product.price_kopecks}
                compact
                className="mt-1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
