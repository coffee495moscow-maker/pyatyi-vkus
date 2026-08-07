export type PlaceholderMotif = "layers" | "swirl" | "petal";

const CATEGORY_MOTIF: Record<string, PlaceholderMotif> = {
  corpus: "layers",
  cheesecake: "swirl",
  fresh: "petal",
};

export function motifForCategory(categorySlug: string): PlaceholderMotif {
  return CATEGORY_MOTIF[categorySlug] ?? "layers";
}

/** Deterministic hash so the same product always gets the same accent hue offset. */
export function hueOffsetForSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 360;
  }
  return hash % 40; // small offset so it stays within the brand's gold family
}
