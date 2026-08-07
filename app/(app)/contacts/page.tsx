import { contacts } from "@/content/contacts";

export default function ContactsPage() {
  return (
    <div className="flex flex-col gap-8 px-5 pt-8 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {contacts.overline}
        </p>
        <h1 className="font-display mt-2 text-3xl">{contacts.title}</h1>
      </div>
      <p className="text-base leading-relaxed text-text-muted">{contacts.lead}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={contacts.phoneHref}
          className="pill border border-border px-5 py-3 text-sm hover:border-accent hover:text-accent"
        >
          {contacts.phone}
        </a>
        <a
          href={contacts.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="pill border border-border px-5 py-3 text-sm hover:border-accent hover:text-accent"
        >
          WhatsApp
        </a>
        <a
          href={contacts.telegramHref}
          target="_blank"
          rel="noreferrer"
          className="pill border border-border px-5 py-3 text-sm hover:border-accent hover:text-accent"
        >
          Telegram
        </a>
      </div>
    </div>
  );
}
