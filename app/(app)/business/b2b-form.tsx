"use client";

import { useActionState } from "react";
import { submitB2bInquiry, type B2bActionState } from "@/lib/actions/b2b";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

const initialState: B2bActionState = { error: null, success: false };

export function B2bForm() {
  const [state, formAction, pending] = useActionState(
    submitB2bInquiry,
    initialState,
  );

  if (state.success) {
    return (
      <p className="rounded-2xl border border-accent/40 bg-surface p-5 text-sm text-text">
        Спасибо! Мы получили заявку и свяжемся с вами в ближайшее время.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="companyName">Компания</Label>
        <Input id="companyName" name="companyName" required />
      </div>
      <div>
        <Label htmlFor="contactName">Имя</Label>
        <Input id="contactName" name="contactName" required />
      </div>
      <div>
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" name="phone" type="tel" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div>
        <Label htmlFor="message">Комментарий</Label>
        <Textarea id="message" name="message" rows={4} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Отправляем…" : "Отправить заявку"}
      </Button>
    </form>
  );
}
