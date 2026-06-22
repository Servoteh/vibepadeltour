import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";
import { RankingBrowser, type RankRow } from "@/components/RankingBrowser";
import { getRanking } from "@/lib/data";

export const metadata: Metadata = {
  title: "Rang lista",
  description: "Zvanična rang lista igrača Vibe Padel Tour-a.",
};


export default async function RangPage() {
  const rows: RankRow[] = (await getRanking()).map((r) => ({
    playerId: r.playerId,
    name: `${r.firstName} ${r.lastName}`,
    points: r.points,
  }));

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="Rang lista"
        title="Zvanična rang lista"
        subtitle="Bodovi se sakupljaju kroz sezone i takmičenja Vibe Padel Tour-a."
      />

      <details className="mt-8 rounded-2xl border border-navy/8 bg-cream-2/50 p-5 text-sm">
        <summary className="cursor-pointer font-semibold text-navy">
          Kako se računaju bodovi?
        </summary>
        <div className="mt-3 space-y-2 leading-relaxed text-muted">
          <p>
            Najvažnija je <b>jačina protivnika</b>. Sve divizije čine jedinstvenu lestvicu
            jačine (kao promocija/ispadanje), a bodovi se množe strmo opadajućim
            koeficijentom niz tu lestvicu:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Liga 1 <b>A-GOLD</b> → A-SILVER → B → C</li>
            <li>… pa Liga 2 (GOLD → … → C), pa Liga 3 (A → B → C)</li>
          </ul>
          <p>
            Svaki korak naniže vredi osetno manje, pa A-GOLD u Ligi 1 stoji u posebnoj
            kategoriji. Tako zbir bodova iz više slabijih divizija ne može da pretekne
            rezultate ostvarene protiv najjače konkurencije. Bodovi iz svih sezona se
            sabiraju.
          </p>
        </div>
      </details>

      <div className="mt-8">
        <RankingBrowser rows={rows} />
      </div>
    </div>
  );
}
