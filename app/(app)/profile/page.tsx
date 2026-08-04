import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { signOut } from "@/lib/actions/auth";
import { TIER_LABELS } from "@/lib/queries/loyalty";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/profile");

  const profile = await getCurrentProfile();

  const links = [
    { href: "/profile/orders", label: "История заказов" },
    { href: "/profile/favorites", label: "Избранное" },
    { href: "/bonuses", label: "Бонусы и достижения" },
    { href: "/profile/edit", label: "Редактировать профиль" },
  ];

  if (profile?.role === "admin") {
    links.push({ href: "/admin", label: "Админ-панель" });
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="font-display text-xl">{profile?.full_name || user.email}</p>
        <p className="text-sm text-text-muted">{user.email}</p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="pill border border-accent/50 px-3 py-1 text-accent">
            {TIER_LABELS[profile?.tier ?? "bronze"]}
          </span>
          <span className="text-text-muted">
            {profile?.points_balance ?? 0} баллов
          </span>
        </div>
      </div>

      <nav className="flex flex-col overflow-hidden rounded-2xl border border-border">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between border-b border-border bg-surface px-5 py-4 text-sm last:border-b-0 hover:text-accent"
          >
            {link.label}
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
        ))}
      </nav>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm text-text-muted hover:text-danger"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </form>
    </div>
  );
}
