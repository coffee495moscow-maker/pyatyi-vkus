import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getCategories,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/queries/products";
import { getFavoriteProductIds } from "@/lib/actions/favorites";
import { ProductPlaceholder } from "@/components/ProductPlaceholder";
import { ProductCard } from "@/components/ProductCard";
import { PromoBadge } from "@/components/PromoBadge";
import { AddToCartButton } from "@/components/AddToCartButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatPrice } from "@/lib/utils";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related, favoriteIds] = await Promise.all([
    getCategories(),
    getRelatedProducts(product.category_id, product.id),
    getFavoriteProductIds(),
  ]);

  const category = categories.find((c) => c.id === product.category_id);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-8 pb-4">
      <div className="relative aspect-[4/5]">
        {product.image_path ? (
          <Image
            src={product.image_path}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <ProductPlaceholder
            slug={product.slug}
            categorySlug={category?.slug ?? ""}
            name={product.name}
            className="h-full w-full"
          />
        )}
        {product.is_hit && <PromoBadge variant="hit">Хит</PromoBadge>}
        {!product.is_hit && product.is_new && (
          <PromoBadge variant="new">New</PromoBadge>
        )}
      </div>

      <div className="flex flex-col gap-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              {category?.name}
            </span>
            <h1 className="font-display mt-1 text-2xl">{product.name}</h1>
          </div>
          <FavoriteButton
            productId={product.id}
            initialFavorited={favoriteIds.has(product.id)}
            path={`/menu/${product.slug}`}
          />
        </div>
        <p className="text-sm leading-relaxed text-text-muted">
          {product.description}
        </p>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <span className="font-display text-2xl">
            {formatPrice(product.price_kopecks)}
          </span>
          <AddToCartButton
            productId={product.id}
            slug={product.slug}
            name={product.name}
            priceKopecks={product.price_kopecks}
            className="flex-1"
          />
        </div>
      </div>

      {related.length > 0 && (
        <div className="flex flex-col gap-4 px-5">
          <h2 className="font-display text-xl">Вам может понравиться</h2>
          <div className="grid grid-cols-2 gap-3">
            {related.map((p) => {
              const c = categoryById.get(p.category_id);
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  categorySlug={c?.slug ?? ""}
                  categoryName={c?.name ?? ""}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
