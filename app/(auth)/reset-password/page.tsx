import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="font-display mb-2 text-2xl">Восстановление пароля</h1>
      <p className="mb-6 text-sm text-text-muted">
        Укажите email — пришлём ссылку для сброса пароля.
      </p>
      <ResetPasswordForm />
    </>
  );
}
