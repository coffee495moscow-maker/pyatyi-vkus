import { brand } from "@/content/brand";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8 px-5 pt-8 pb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        О бренде
      </p>
      <h1 className="font-display text-3xl leading-tight">
        Не просто сладкое.
        <br />
        {brand.name}.
      </h1>
      <div className="flex flex-col gap-4 text-base leading-relaxed text-text-muted">
        {brand.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-6">
        {brand.values.map((value) => (
          <article key={value.index}>
            <span className="text-xs text-accent">{value.index}</span>
            <h3 className="font-display mt-3 text-xl">{value.title}</h3>
            <p className="mt-1 text-sm text-text-muted">{value.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
