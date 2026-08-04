import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Пятый вкус — премиальная кондитерская",
    short_name: "Пятый вкус",
    description:
      "Коллекция десертов, бонусы и онлайн-заказ кондитерской «Пятый вкус».",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1210",
    theme_color: "#1a1210",
    lang: "ru",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
