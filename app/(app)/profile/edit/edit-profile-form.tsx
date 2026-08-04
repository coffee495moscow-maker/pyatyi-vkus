"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: ProfileActionState = { error: null };

export function EditProfileForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="fullName">Имя</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} />
      </div>
      <div>
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={phone} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Сохраняем…" : "Сохранить"}
      </Button>
    </form>
  );
}
