import Link from "next/link";
import Image from "next/image";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { PromoBadge } from "@/components/PromoBadge";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/db/types";

export function ProductCard({
  product,
  categorySlug,
  categoryName,
}: {
  product: Product;
  categorySlug: string;
  categoryName: string;
}) {
  return (
    <Link
      href={`/menu/${product.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="relative aspect-[4/5]">
        {product.image_path ? (
          <Image
            src={product.image_path}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <ProductPlaceholder
            slug={product.slug}
            categorySlug={categorySlug}
            name={product.name}
            className="h-full w-full"
          />
        )}
        {product.is_hit && <PromoBadge variant="hit">Хит</PromoBadge>}
        {!product.is_hit && product.is_new && (
          <PromoBadge variant="new">New</PromoBadge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
          {categoryName}
        </span>
        <h3 className="font-display text-lg">{product.name}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-text-muted">
          {product.description}
        </p>
        <p className="mt-1 font-semibold text-text">
          {formatPrice(product.price_kopecks)}
        </p>
      </div>
    </Link>
  );
}
