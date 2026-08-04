import { delivery } from "@/content/delivery";

export default function DeliveryPage() {
  return (
    <div className="flex flex-col gap-8 px-5 pt-8 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {delivery.overline}
        </p>
        <h1 className="font-display mt-2 text-3xl">{delivery.title}</h1>
      </div>
      <div className="flex flex-col gap-3">
        {delivery.items.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <h3 className="font-display text-lg">{item.title}</h3>
            <p className="mt-1 text-sm text-text-muted">{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
