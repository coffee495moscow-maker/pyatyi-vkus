import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { brand } from "@/content/brand";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 px-5 pt-8">
      <section className="flex flex-col gap-5">
        <BrandLogo className="text-accent" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {brand.location}
        </p>
        <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
          {brand.tagline}
        </h1>
        <p className="max-w-md text-base leading-relaxed text-text-muted">
          {brand.lead}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/menu">
            <Button size="lg">Смотреть коллекцию</Button>
          </Link>
          <Link href="/contacts">
            <Button size="lg" variant="outline">
              Обсудить заказ
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {brand.values.map((value) => (
          <article
            key={value.index}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <span className="text-xs text-accent">{value.index}</span>
            <h3 className="font-display mt-3 text-xl">{value.title}</h3>
            <p className="mt-1 text-sm text-text-muted">{value.description}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl">О бренде</h2>
        {brand.story.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-relaxed text-text-muted">
            {paragraph}
          </p>
        ))}
        <Link href="/about" className="mt-2 text-sm font-semibold text-accent">
          Узнать больше →
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 pb-4">
        <Link
          href="/business"
          className="rounded-2xl border border-border bg-surface p-5 hover:border-accent"
        >
          <h3 className="font-display text-lg">Для бизнеса</h3>
          <p className="mt-1 text-sm text-text-muted">Опт для кофеен и HoReCa</p>
        </Link>
        <Link
          href="/delivery"
          className="rounded-2xl border border-border bg-surface p-5 hover:border-accent"
        >
          <h3 className="font-display text-lg">Доставка</h3>
          <p className="mt-1 text-sm text-text-muted">Москва и область</p>
        </Link>
      </section>
    </div>
  );
}
