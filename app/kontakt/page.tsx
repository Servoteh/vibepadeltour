import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Prijavi se kao igrač, klub ili partner Vibe Padel Tour-a.",
};

const CONTACTS = [
  {
    label: "Email",
    value: "vibepadeltour@gmail.com",
    href: "mailto:vibepadeltour@gmail.com",
    icon: "✉️",
  },
  {
    label: "Telefon",
    value: "+381 64 1822 184",
    href: "tel:+381641822184",
    icon: "📞",
  },
  {
    label: "Instagram",
    value: "@vibepadeltour",
    href: "https://www.instagram.com/vibepadeltour/",
    icon: "📸",
  },
];

export default function KontaktPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="Kontakt"
        title="Pridruži se Vibe Padel Tour-u"
        subtitle="Prijavi ekipu za ligu, poveži svoj klub ili postani partner. Javi nam se — odgovaramo brzo."
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="space-y-4">
            {CONTACTS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-navy/8 bg-paper p-5 shadow-[var(--shadow-soft)] transition hover:border-gold/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-xl">
                  {c.icon}
                </span>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted">{c.label}</div>
                  <div className="font-medium text-navy">{c.value}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="court-grid mt-6 rounded-[var(--radius-card)] bg-ink p-7 text-white">
            <h3 className="font-display text-lg font-bold text-gold">BPK liga — prijave</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Želiš da zaigraš narednu sezonu najveće padel lige u Srbiji? Piši nam ili
              pozovi — pomoći ćemo ti da nađeš ekipu i grupu po tvom nivou.
            </p>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
