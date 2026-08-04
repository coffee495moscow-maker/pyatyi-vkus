import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display mb-2 text-2xl">Регистрация</h1>
      <p className="mb-6 text-sm text-text-muted">
        50 баллов в подарок сразу после регистрации.
      </p>
      <SignupForm />
    </>
  );
}
