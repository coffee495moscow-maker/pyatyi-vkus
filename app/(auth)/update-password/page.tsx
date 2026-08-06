import { UpdatePasswordForm } from "./update-password-form";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <h1 className="font-display mb-6 text-2xl">Новый пароль</h1>
      {token ? (
        <UpdatePasswordForm token={token} />
      ) : (
        <p className="text-sm text-danger">
          Ссылка неполная. Запросите восстановление пароля заново.
        </p>
      )}
    </>
  );
}
