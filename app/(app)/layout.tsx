import Link from "next/link";
import { BottomTabBar } from "@/components/BottomTabBar";
import { CartFAB } from "@/components/CartFAB";
import { brand } from "@/content/brand";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-5 py-4 backdrop-blur">
        <Link href="/" className="font-display flex items-center gap-2 text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent text-accent">
            5
          </span>
          {brand.name}
        </Link>
        <Link
          href="/profile"
          className="text-sm text-text-muted hover:text-accent"
        >
          Профиль
        </Link>
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <CartFAB />
      <BottomTabBar />
    </div>
  );
}
