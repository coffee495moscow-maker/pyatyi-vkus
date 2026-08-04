"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: AuthActionState = { error: null };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.error === null && state !== initialState) {
    return (
      <p className="text-sm text-text-muted">
        Если такой email зарегистрирован, мы отправили на него ссылку для
        сброса пароля.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Отправляем…" : "Отправить ссылку"}
      </Button>
    </form>
  );
}
