import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";
import { PlayersBrowser, type PlayerLite } from "@/components/PlayersBrowser";
import { getPlayers, getRanking, playerName } from "@/lib/data";

export const metadata: Metadata = {
  title: "Igrači",
  description: "Baza igrača Vibe Padel Tour-a — pretraži igrače i pogledaj njihove bodove.",
};


export default async function IgraciPage() {
  const [players, ranking] = await Promise.all([getPlayers(), getRanking()]);
  const pointsMap = new Map(ranking.map((r) => [r.playerId, r.points]));
  const lite: PlayerLite[] = players.map((p) => ({
    id: p.id,
    name: playerName(p),
    points: pointsMap.get(p.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="Zajednica"
        title="Igrači"
        subtitle={`${players.length} registrovanih igrača u bazi Vibe Padel Tour-a.`}
      />
      <div className="mt-10">
        <PlayersBrowser players={lite} />
      </div>
    </div>
  );
}
