import { hueOffsetForSlug, motifForCategory } from "@/lib/placeholders";
import { cn } from "@/lib/utils";

const BASE_HUE = 33; // matches --color-accent (#d99a5b)

function Motif({ motif }: { motif: ReturnType<typeof motifForCategory> }) {
  const common = { fill: "none", stroke: "white", strokeOpacity: 0.35, strokeWidth: 1.4 };

  if (motif === "swirl") {
    return (
      <svg viewBox="0 0 200 200" className="h-2/3 w-2/3" aria-hidden>
        <circle cx="100" cy="100" r="70" {...common} />
        <circle cx="100" cy="100" r="46" {...common} strokeOpacity={0.25} />
        <path d="M100 30 a70 70 0 0 1 0 140" {...common} strokeOpacity={0.5} />
      </svg>
    );
  }

  if (motif === "petal") {
    return (
      <svg viewBox="0 0 200 200" className="h-2/3 w-2/3" aria-hidden>
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse
            key={angle}
            cx="100"
            cy="100"
            rx="70"
            ry="26"
            transform={`rotate(${angle} 100 100)`}
            {...common}
          />
        ))}
      </svg>
    );
  }

  // "layers" — corpus / cased pastries
  return (
    <svg viewBox="0 0 200 200" className="h-2/3 w-2/3" aria-hidden>
      <rect x="40" y="50" width="120" height="100" rx="20" {...common} />
      <rect x="55" y="70" width="90" height="70" rx="14" {...common} strokeOpacity={0.5} />
      <rect x="70" y="90" width="60" height="40" rx="10" {...common} strokeOpacity={0.7} />
    </svg>
  );
}

export function ProductPlaceholder({
  slug,
  categorySlug,
  name,
  className,
}: {
  slug: string;
  categorySlug: string;
  name: string;
  className?: string;
}) {
  const offset = hueOffsetForSlug(slug);
  const hue = BASE_HUE + offset;
  const motif = motifForCategory(categorySlug);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 45% 22%), hsl(${hue + 12} 55% 12%))`,
      }}
    >
      <Motif motif={motif} />
      <span className="font-display absolute inset-x-3 bottom-3 text-center text-sm text-white/70">
        {name}
      </span>
    </div>
  );
}
