import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

const NAV = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/menu", label: "Меню" },
  { href: "/admin/promotions", label: "Акции" },
  { href: "/admin/b2b", label: "B2B-заявки" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) redirect("/login?redirect=/admin");

  // Defense in depth — proxy.ts already enforces this at the routing layer.
  if (user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text">
      <header className="sticky top-0 z-20 border-b border-border bg-surface px-5 py-4">
        <Link href="/" className="font-display text-lg">
          Пятый вкус · Админ
        </Link>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-5">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 px-3 py-3 text-sm text-text-muted hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
