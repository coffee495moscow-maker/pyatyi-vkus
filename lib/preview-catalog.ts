import type { Category, Product } from "@/lib/db/types";

const timestamp = "2026-08-06T00:00:00.000Z";

export const previewCategories: Category[] = [
  { id: "preview-corpus", slug: "corpus", name: "Корпусные пирожные", sort_order: 1 },
  { id: "preview-cheesecake", slug: "cheesecake", name: "Чизкейки", sort_order: 2 },
  { id: "preview-fresh", slug: "fresh", name: "Свежая продукция", sort_order: 3 },
];

const product = (
  slug: string,
  name: string,
  description: string,
  price_kopecks: number,
  category_id: string,
  sort_order: number,
  flags: Pick<Product, "is_new" | "is_hit" | "is_featured">,
): Product => ({
  id: `preview-${slug}`,
  slug,
  name,
  description,
  price_kopecks,
  category_id,
  image_path: null,
  is_available: true,
  sort_order,
  created_at: timestamp,
  updated_at: timestamp,
  ...flags,
});

export const previewProducts: Product[] = [
  product("malina", "Малина", "Малиновое конфи, ванильный мусс, миндальный брауни и тонкий корпус из бельгийского шоколада.", 29000, "preview-corpus", 1, { is_new: false, is_hit: true, is_featured: true }),
  product("mango", "Манго", "Тропическое манго, нежный мусс и выразительная текстура в премиальной подаче.", 31000, "preview-corpus", 2, { is_new: false, is_hit: false, is_featured: false }),
  product("limon", "Лимон", "Свежий цитрусовый вкус, мягкая кислинка и тонкий шоколадный корпус.", 29000, "preview-corpus", 3, { is_new: false, is_hit: false, is_featured: false }),
  product("chernika", "Черника", "Черничное конфи, воздушный мусс и деликатная ягодная сладость.", 33000, "preview-corpus", 4, { is_new: true, is_hit: false, is_featured: false }),
  product("san-sebastian-classic", "Сан-Себастьян классический", "Нежная кремовая середина, карамелизированная корочка и чистый сливочный вкус.", 19000, "preview-cheesecake", 5, { is_new: false, is_hit: true, is_featured: true }),
  product("san-sebastian-pistachio", "Сан-Себастьян фисташковый", "Плотный фисташковый вкус и бархатистая текстура баскского чизкейка.", 23000, "preview-cheesecake", 6, { is_new: true, is_hit: false, is_featured: false }),
  product("limonnyy-tart", "Лимонный тарт", "Хрустящая основа, лимонный крем и воздушная меренга.", 19000, "preview-fresh", 7, { is_new: false, is_hit: false, is_featured: false }),
  product("anna-pavlova", "Анна Павлова", "Хрустящее безе, нежный крем и свежий ягодный акцент.", 21000, "preview-fresh", 8, { is_new: false, is_hit: false, is_featured: true }),
];

export function shouldUsePreviewCatalog(value = process.env.PREVIEW_MODE): boolean {
  return value === "true";
}
