import type { Metadata } from "next";
import { SectionHeading, Button } from "@/components/ui";
import { getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "O nama",
  description: "Ko stoji iza Vibe Padel Tour-a — premium padel zajednice u regionu.",
};

const VALUES = [
  {
    title: "Premium doživljaj",
    text: "Vrhunska organizacija turnira, jasna pravila i atmosfera koja okuplja igrače svih nivoa.",
  },
  {
    title: "Regionalna zajednica",
    text: "Od Beograda do Jadrana — povezujemo klubove, hotele i igrače u jedinstvenu padel mrežu.",
  },
  {
    title: "Takmičarski duh",
    text: "Lige, grupe, plasmani i rang lista koji prate napredak svake ekipe kroz sezone.",
  },
];


export default async function ONamaPage() {
  const stats = await getStats();
  return (
    <>
      <section className="court-grid bg-ink text-white">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-24">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            O nama
          </span>
          <h1 className="font-display mx-auto mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Regionalni padel tour koji <span className="text-gold-gradient">raste</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Vibe Padel Tour okuplja igrače, klubove, hotele i sponzore oko zajedničke
            strasti — padela. Organizujemo lige i turnire, vodimo rang listu i gradimo
            premium padel zajednicu u regionu.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-[var(--radius-card)] border border-navy/8 bg-paper p-7 shadow-[var(--shadow-soft)]"
            >
              <h3 className="font-display text-lg font-bold text-navy">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 rounded-[var(--radius-card)] border border-navy/8 bg-cream-2/50 p-10 sm:grid-cols-4">
          {[
            { label: "Igrača", value: stats.players },
            { label: "Ekipa", value: stats.teams },
            { label: "Liga", value: stats.leagues },
            { label: "Klubova", value: stats.clubs },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-bold text-gold-deep">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <SectionHeading
            align="center"
            title="Pridruži se zajednici"
            subtitle="Bilo da si igrač, klub ili partner — ima mesta za tebe."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/kontakt" variant="gold">Prijavi se</Button>
            <Button href="/lige" variant="ghost">Pogledaj lige</Button>
          </div>
        </div>
      </section>
    </>
  );
}
