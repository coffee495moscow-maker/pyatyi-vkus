import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <>
      <h1 className="font-display mb-6 text-2xl">Вход</h1>
      <LoginForm redirectTo={redirect ?? "/"} />
    </>
  );
}
