import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui";
import {
  getPlayers,
  getPlayer,
  playerName,
  getRankForPlayer,
  getStandingsForPlayer,
  getTeamsForPlayer,
  getLeague,
  getGroups,
} from "@/lib/data";

export function generateStaticParams() {
  return getPlayers().map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getPlayer(Number(id));
  return { title: p ? playerName(p) : "Igrač" };
}

export default async function PlayerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pid = Number(id);
  const player = getPlayer(pid);
  if (!player) notFound();

  const name = playerName(player);
  const rankInfo = getRankForPlayer(pid);
  const appearances = getStandingsForPlayer(pid);
  const teams = getTeamsForPlayer(pid);

  // Agregati iz nastupa
  const totalPlayed = appearances.reduce((a, s) => a + s.matchesPlayed, 0);
  const totalWon = appearances.reduce((a, s) => a + s.matchesWon, 0);
  const winPct = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

  const groupsLookup = (clubId: number, leagueId: number, groupId: number) => {
    const g = getGroups(clubId, leagueId).find((x) => x.id === groupId);
    const league = getLeague(clubId, leagueId);
    return { groupName: g?.name, league };
  };

  return (
    <>
      <section className="court-grid bg-ink text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <Link href="/igraci" className="text-sm text-white/50 hover:text-gold">
            ← Svi igrači
          </Link>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar name={name} size={92} className="ring-2 ring-gold/40" />
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{name}</h1>
              <div className="mt-3 flex flex-wrap gap-3">
                {rankInfo && (
                  <Badge tone="gold">#{rankInfo.rank} na rang listi</Badge>
                )}
                <Badge tone="sea">{rankInfo?.points ?? 0} bodova</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        {/* Statistika */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Bodova", value: rankInfo?.points ?? 0 },
            { label: "Odigrano mečeva", value: totalPlayed },
            { label: "Pobeda", value: totalWon },
            { label: "Procenat pobeda", value: `${winPct}%` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-navy/8 bg-paper p-5 text-center shadow-[var(--shadow-soft)]"
            >
              <div className="font-display text-3xl font-bold text-navy">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          {/* Nastupi po grupama */}
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Nastupi u ligama</h2>
            {appearances.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nema zabeleženih nastupa u grupnoj fazi.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {appearances.map((s, i) => {
                  const { groupName, league } = groupsLookup(s.clubId, s.leagueId, s.groupId);
                  return (
                    <Link
                      key={`${s.groupId}-${s.teamId}-${i}`}
                      href={`/lige/${s.clubId}/${s.leagueId}`}
                      className="block rounded-2xl border border-navy/8 bg-paper p-4 shadow-[var(--shadow-soft)] transition hover:border-gold/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-navy">
                          {league?.name ?? "Liga"}
                        </span>
                        {groupName && <Badge tone="muted">Grupa {groupName}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted">{s.teamName}</p>
                      <div className="mt-3 flex gap-5 text-xs text-muted">
                        <span><b className="text-navy">{s.matchesWon}</b>/{s.matchesPlayed} pobeda</span>
                        <span><b className="text-navy">{s.points}</b> bodova</span>
                        <span>set {s.setsDiff > 0 ? `+${s.setsDiff}` : s.setsDiff}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Parovi / partneri */}
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Parovi</h2>
            {teams.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nema zabeleženih parova.</p>
            ) : (
              <div className="mt-5 space-y-2">
                {teams.map((t) => {
                  const partnerId = t.player1Id === pid ? t.player2Id : t.player1Id;
                  return (
                    <Link
                      key={t.id}
                      href={`/igraci/${partnerId}`}
                      className="flex items-center justify-between rounded-2xl border border-navy/8 bg-paper px-4 py-3 text-sm shadow-[var(--shadow-soft)] transition hover:border-gold/40"
                    >
                      <span className="text-navy">{t.name}</span>
                      <span className="text-xs text-gold-deep">par →</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
