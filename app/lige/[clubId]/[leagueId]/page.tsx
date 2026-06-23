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
  getAcceptedFixtures,
} from "@/lib/data";

const SCHED_HOURS = [17, 18, 19, 20, 21, 22];
const SCHED_COURTS = [1, 2, 3, 4, 5, 6];

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
  const [league, club, groups, rounds, fixtures] = await Promise.all([
    getLeague(cId, lId),
    getClub(cId),
    getGroups(cId, lId),
    getRounds(cId, lId),
    getAcceptedFixtures(cId, lId),
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

  // Prihvaćen raspored po kolima (mreža teren × sat).
  const teamName = new Map<string, string>();
  for (const s of groupStandings.flat()) teamName.set(`${s.groupId}:${s.teamId}`, s.teamName);
  const fxName = (gid: number, tid: number) => teamName.get(`${gid}:${tid}`) || `Tim ${tid}`;
  const roundName = new Map(rounds.map((r) => [r.id, r.name]));
  const fixturesByRound = new Map<number, typeof fixtures>();
  for (const f of fixtures) {
    const list = fixturesByRound.get(f.roundId) ?? fixturesByRound.set(f.roundId, []).get(f.roundId)!;
    list.push(f);
  }
  const scheduledRounds = rounds.filter((r) => fixturesByRound.has(r.id));

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

        {scheduledRounds.length > 0 && (
          <div className="mt-14">
            <h2 className="font-display text-2xl font-bold text-navy">Raspored</h2>
            <p className="mt-2 text-sm text-muted">
              Teren 2 nosi najjače mečeve. Termini su 17–23h.
            </p>
            <div className="mt-6 space-y-8">
              {scheduledRounds.map((r) => {
                const list = fixturesByRound.get(r.id) ?? [];
                const cell = new Map<string, (typeof list)[number]>();
                for (const f of list) cell.set(`${f.court}:${f.hour}`, f);
                return (
                  <div key={r.id}>
                    <h3 className="mb-3 font-semibold text-navy">
                      {roundName.get(r.id) ?? `Kolo ${r.id}`}
                      {r.date ? <span className="ml-2 text-sm text-muted">{r.date}</span> : null}
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-navy/8 bg-paper shadow-[var(--shadow-soft)]">
                      <table className="w-full min-w-[720px] border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="border-b border-navy/10 px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">
                              Sat
                            </th>
                            {SCHED_COURTS.map((c) => (
                              <th
                                key={c}
                                className={`border-b border-navy/10 px-3 py-2 text-left text-xs uppercase tracking-wider ${
                                  c === 2 ? "text-gold-deep" : "text-muted"
                                }`}
                              >
                                Teren {c}
                                {c === 2 ? " ★" : ""}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {SCHED_HOURS.map((h) => (
                            <tr key={h}>
                              <td className="border-b border-navy/8 px-3 py-2 font-semibold text-navy">
                                {h}:00
                              </td>
                              {SCHED_COURTS.map((c) => {
                                const f = cell.get(`${c}:${h}`);
                                return (
                                  <td key={c} className="border-b border-navy/8 px-3 py-2">
                                    {f ? (
                                      <span className="text-navy">
                                        {fxName(f.groupId, f.team1Id)}
                                        <span className="text-muted"> vs </span>
                                        {fxName(f.groupId, f.team2Id)}
                                      </span>
                                    ) : (
                                      <span className="text-navy/20">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
