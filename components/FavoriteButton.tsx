"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  initialFavorited,
  path,
}: {
  productId: string;
  initialFavorited: boolean;
  path: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setFavorited((f) => !f);
        startTransition(async () => {
          const result = await toggleFavorite(productId, path);
          if (result.error) setFavorited((f) => !f);
        });
      }}
      aria-label={favorited ? "Убрать из избранного" : "В избранное"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:border-accent"
    >
      <Heart
        size={18}
        className={cn(favorited ? "fill-accent text-accent" : "text-text-muted")}
      />
    </button>
  );
}
