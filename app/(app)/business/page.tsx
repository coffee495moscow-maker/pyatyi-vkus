import { business } from "@/content/business";
import { B2bForm } from "./b2b-form";

export default function BusinessPage() {
  return (
    <div className="flex flex-col gap-8 px-5 pt-8 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {business.overline}
        </p>
        <h1 className="font-display mt-2 text-3xl">{business.title}</h1>
      </div>
      <p className="text-base leading-relaxed text-text-muted">{business.lead}</p>
      <ul className="flex flex-col gap-3 border-t border-border pt-6">
        {business.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3 text-sm text-text">
            <span className="text-accent">—</span>
            {bullet}
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-6">
        <h2 className="font-display mb-4 text-xl">Оставить заявку</h2>
        <B2bForm />
      </div>
    </div>
  );
}
