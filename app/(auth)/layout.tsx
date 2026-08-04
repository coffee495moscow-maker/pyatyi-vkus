import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 py-12">
      <Link href="/" className="font-display mb-10 text-2xl text-text">
        Пятый вкус
      </Link>
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8">
        {children}
      </div>
    </div>
  );
}
