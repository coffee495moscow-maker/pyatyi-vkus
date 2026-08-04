// One-off generator for the placeholder PWA icon set, rasterized from an
// inline SVG brand mark via `sharp` (not a project dependency — install it
// separately to re-run: `npm i -D sharp && node scripts/generate-icons.mjs`).
// Swap these for real branded icons before launch.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BG = "#1a1210";
const ACCENT = "#d99a5b";

function markSvg({ size, padding = 0 }) {
  const inner = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = inner * 0.32;
  const fontSize = inner * 0.34;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ACCENT}" stroke-width="${inner * 0.035}"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
        font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" fill="${ACCENT}">5</text>
</svg>`;
}

mkdirSync("public/icons", { recursive: true });

const targets = [
  { file: "public/icons/icon-192.png", size: 192, padding: 0 },
  { file: "public/icons/icon-512.png", size: 512, padding: 0 },
  // Maskable: keep the mark inside the ~80% safe zone since OS shells may crop to a circle/rounded square.
  { file: "public/icons/icon-maskable-512.png", size: 512, padding: 51 },
  { file: "public/apple-touch-icon.png", size: 180, padding: 0 },
];

for (const t of targets) {
  await sharp(Buffer.from(markSvg(t))).png().toFile(t.file);
  console.log("wrote", t.file);
}
