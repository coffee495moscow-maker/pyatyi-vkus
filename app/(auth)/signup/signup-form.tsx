"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: AuthActionState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="fullName">Имя</Label>
        <Input id="fullName" name="fullName" type="text" autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Создаём аккаунт…" : "Зарегистрироваться"}
      </Button>
      <p className="text-center text-sm text-text-muted">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
