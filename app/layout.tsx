import type { Metadata, Viewport } from "next";
import { Oranienbaum, Manrope } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const oranienbaum = Oranienbaum({
  variable: "--font-oranienbaum",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Пятый вкус — премиальная кондитерская",
  description:
    "Пятый вкус — премиальные десерты для кофеен, ресторанов и частных заказов. Коллекция, бонусы, онлайн-заказ.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Пятый вкус",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// The whole app reads from Postgres and/or the session cookie somewhere in
// its tree (catalog, cart, account, admin) — no page benefits from static
// generation, and forcing dynamic rendering here avoids DB calls sneaking
// into the build step (which has no database available).
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#211a16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${oranienbaum.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
