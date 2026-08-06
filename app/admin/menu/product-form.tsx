"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { Category, Product } from "@/lib/db/types";
import type { ProductActionState } from "@/lib/actions/admin/products";

const initialState: ProductActionState = { error: null };

export function ProductForm({
  categories,
  product,
  action,
}: {
  categories: Category[];
  product?: Product;
  action: (
    prevState: ProductActionState,
    formData: FormData,
  ) => Promise<ProductActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" required defaultValue={product?.name} />
      </div>
      <div>
        <Label htmlFor="slug">Слаг (для URL)</Label>
        <Input id="slug" name="slug" required defaultValue={product?.slug} />
      </div>
      <div>
        <Label htmlFor="categoryId">Категория</Label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={product?.category_id}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text outline-none focus:border-accent"
        >
          <option value="" disabled>
            Выберите категорию
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={product?.description} />
      </div>
      <div>
        <Label htmlFor="priceRub">Цена, ₽</Label>
        <Input
          id="priceRub"
          name="priceRub"
          type="number"
          min={0}
          step="1"
          required
          defaultValue={product ? Math.round(product.price_kopecks / 100) : undefined}
        />
      </div>
      <div>
        <Label htmlFor="image">Фото (необязательно — иначе заглушка)</Label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="w-full text-sm text-text-muted"
        />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isAvailable" defaultChecked={product?.is_available ?? true} />
          В продаже
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isHit" defaultChecked={product?.is_hit} />
          Хит
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isNew" defaultChecked={product?.is_new} />
          New
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isFeatured" defaultChecked={product?.is_featured} />
          Рекомендуемый
        </label>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Сохраняем…" : "Сохранить"}
      </Button>
    </form>
  );
}
