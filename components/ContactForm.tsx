"use client";

import { useState } from "react";

const TYPES = [
  { id: "igrac", label: "Igrač" },
  { id: "partner", label: "Partner / Sponzor" },
  { id: "klub", label: "Klub" },
];

export function ContactForm() {
  const [type, setType] = useState("igrac");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const typeLabel = TYPES.find((t) => t.id === type)?.label ?? "";
  const subject = encodeURIComponent(`Vibe Padel Tour — prijava: ${typeLabel}`);
  const body = encodeURIComponent(
    `Tip prijave: ${typeLabel}\nIme: ${name}\nKontakt: ${contact}\n\nPoruka:\n${message}`
  );
  const mailto = `mailto:vibepadeltour@gmail.com?subject=${subject}&body=${body}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = mailto;
      }}
      className="rounded-[var(--radius-card)] border border-navy/8 bg-paper p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <label className="block text-sm font-semibold text-navy">Prijavljujem se kao</label>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
              type === t.id
                ? "border-gold bg-gold/10 text-gold-deep"
                : "border-navy/12 text-muted hover:border-navy/25"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy">Ime i prezime</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-navy/12 px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
            placeholder="Npr. Marko Marković"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Email ili telefon</label>
          <input
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-navy/12 px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
            placeholder="ime@email.com / 06x xxx xxxx"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Poruka</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-navy/12 px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
            placeholder="Reci nam nešto više…"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] transition hover:bg-gold-bright"
      >
        Pošalji prijavu
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Otvoriće se tvoj email klijent sa popunjenom porukom.
      </p>
    </form>
  );
}
