"use client";

import { useActionState } from "react";
import {
  createPromotion,
  type PromotionActionState,
} from "@/lib/actions/admin/promotions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

const initialState: PromotionActionState = { error: null };

export function PromotionForm() {
  const [state, formAction, pending] = useActionState(createPromotion, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="title">Заголовок</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Сохраняем…" : "Сохранить черновик"}
      </Button>
      <p className="text-xs text-text-muted">
        Акция сохранится как черновик — опубликуйте её из списка, чтобы
        разослать push-уведомление подписчикам.
      </p>
    </form>
  );
}
