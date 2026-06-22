import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { LeagueView } from "@/components/LeagueView";
import {
  getClub,
  getLeague,
  getGroups,
  getStandingsForGroup,
  getRounds,
} from "@/lib/data";

type Params = { clubId: string; leagueId: string };

// SSR: čita iz baze na svaki zahtev, pa se admin izmene vide odmah.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { clubId, leagueId } = await params;
  const league = await getLeague(Number(clubId), Number(leagueId));
  return { title: league?.name ?? "Liga" };
}

export default async function LeagueDetail({ params }: { params: Promise<Params> }) {
  const { clubId, leagueId } = await params;
  const cId = Number(clubId);
  const lId = Number(leagueId);
  const [league, club, groups, rounds] = await Promise.all([
    getLeague(cId, lId),
    getClub(cId),
    getGroups(cId, lId),
    getRounds(cId, lId),
  ]);
  if (!league || !club) notFound();

  const standingsByGroup: Record<number, Awaited<ReturnType<typeof getStandingsForGroup>>> = {};
  let totalTeams = 0;
  const groupStandings = await Promise.all(groups.map((g) => getStandingsForGroup(g.id)));
  groups.forEach((g, i) => {
    standingsByGroup[g.id] = groupStandings[i];
    totalTeams += groupStandings[i].length;
  });
  const intro = league.description?.split("\n").filter(Boolean).slice(0, 2).join(" ");

  return (
    <>
      {/* HERO tamni */}
      <section className="court-grid bg-ink text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <Link href="/lige" className="text-sm text-white/50 hover:text-gold">
            ← Sve lige
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge tone="sea">{club.name}</Badge>
            {league.status && (
              <Badge tone={league.status === "active" ? "lime" : "muted"}>
                {league.status === "active" ? "U toku" : "Završena"}
              </Badge>
            )}
          </div>
          <h1 className="font-display mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            {league.name}
          </h1>
          {intro && (
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
              {intro.slice(0, 360)}
              {intro.length > 360 ? "…" : ""}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-8">
            <div>
              <div className="font-display text-3xl font-bold text-gold">{groups.length}</div>
              <div className="text-xs uppercase tracking-wider text-white/50">Grupa</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-gold">{totalTeams}</div>
              <div className="text-xs uppercase tracking-wider text-white/50">Ekipa</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-gold">{rounds.length}</div>
              <div className="text-xs uppercase tracking-wider text-white/50">Kola</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <LeagueView
          groups={groups}
          standingsByGroup={standingsByGroup}
          rounds={rounds}
          rules={league.rules ?? ""}
        />
      </section>
    </>
  );
}
