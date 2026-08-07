import Link from "next/link";
import { BottomTabBar } from "@/components/BottomTabBar";
import { CartFAB } from "@/components/CartFAB";
import { InstallPrompt } from "@/components/InstallPrompt";
import { BrandLogo } from "@/components/BrandLogo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-5 py-4 backdrop-blur">
        <Link href="/" aria-label="Пятый вкус — на главную">
          <BrandLogo compact />
        </Link>
        <Link
          href="/profile"
          className="text-sm text-text-muted hover:text-accent"
        >
          Профиль
        </Link>
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <InstallPrompt />
      <CartFAB />
      <BottomTabBar />
    </div>
  );
}
