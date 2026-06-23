import { getResultEntryData, getLeagueManageData } from "@/lib/admin-data";
import { getPlayers, playerName } from "@/lib/data";
import { updateStanding, removePair } from "@/app/admin/actions";
import { GroupsManager } from "./GroupsManager";
import { PairAdder } from "./PairAdder";

export const dynamic = "force-dynamic";

const numField =
  "w-16 rounded-lg border border-navy/15 bg-paper px-2 py-1 text-sm text-navy outline-none focus:border-gold/60";

export default async function EkipePage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const sp = await searchParams;
  const leagueKey = sp.league ?? "";

  const { leagues } = await getResultEntryData();

  let groups: { id: number; name: string }[] = [];
  let pairsByGroup = new Map<number, Awaited<ReturnType<typeof getLeagueManageData>>["pairs"]>();
  let players: { id: number; name: string }[] = [];

  if (leagueKey) {
    const [clubId, leagueId] = leagueKey.split(":").map(Number);
    const [manage, allPlayers] = await Promise.all([
      getLeagueManageData(clubId, leagueId),
      getPlayers(),
    ]);
    groups = manage.groups;
    pairsByGroup = new Map();
    for (const p of manage.pairs) {
      const list = pairsByGroup.get(p.groupId) ?? pairsByGroup.set(p.groupId, []).get(p.groupId)!;
      list.push(p);
    }
    players = allPlayers.map((p) => ({ id: p.id, name: playerName(p) }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Ekipe i grupe</h1>
        <p className="mt-2 text-muted">Upravljaj grupama, upiši parove i ručno koriguj tabelu.</p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-3">
        <select
          name="league"
          defaultValue={leagueKey}
          className="rounded-xl border border-navy/15 bg-paper px-4 py-2.5 text-sm text-navy outline-none focus:border-gold/60"
        >
          <option value="">— izaberi ligu —</option>
          {leagues.map((l) => (
            <option key={`${l.clubId}:${l.id}`} value={`${l.clubId}:${l.id}`}>
              {l.name}
            </option>
          ))}
        </select>
        <button className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5">
          Otvori
        </button>
      </form>

      {leagueKey && (
        <>
          <GroupsManager leagueKey={leagueKey} groups={groups} />
          <PairAdder leagueKey={leagueKey} groups={groups} players={players} />

          <div className="space-y-8">
            {groups.map((g) => {
              const pairs = pairsByGroup.get(g.id) ?? [];
              return (
                <div key={g.id}>
                  <h3 className="mb-3 font-display text-lg font-bold text-navy">Grupa {g.name}</h3>
                  <div className="space-y-2">
                    <div className="hidden gap-2 px-4 text-xs uppercase tracking-wider text-muted sm:flex">
                      <span className="flex-1">Par</span>
                      <span className="w-16 text-center">Odigr.</span>
                      <span className="w-16 text-center">Pob.</span>
                      <span className="w-16 text-center">Bod.</span>
                      <span className="w-16 text-center">Gem ±</span>
                      <span className="w-16 text-center">Set ±</span>
                      <span className="w-32" />
                    </div>
                    {pairs.map((p) => (
                      <div
                        key={p.teamId}
                        className="flex flex-wrap items-center gap-2 rounded-2xl border border-navy/8 bg-paper px-4 py-2 shadow-[var(--shadow-soft)]"
                      >
                        <form action={updateStanding} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="group_id" value={g.id} />
                          <input type="hidden" name="team_id" value={p.teamId} />
                          <span className="min-w-[160px] flex-1 text-sm font-medium text-navy">{p.teamName}</span>
                          <input name="matches_played" type="number" defaultValue={p.played} className={numField} aria-label="Odigrano" />
                          <input name="matches_won" type="number" defaultValue={p.won} className={numField} aria-label="Pobede" />
                          <input name="points" type="number" defaultValue={p.points} className={numField} aria-label="Bodovi" />
                          <input name="games_diff" type="number" defaultValue={p.gamesDiff} className={numField} aria-label="Gem razlika" />
                          <input name="sets_diff" type="number" defaultValue={p.setsDiff} className={numField} aria-label="Set razlika" />
                          <button className="rounded-full bg-navy/90 px-3 py-1 text-xs font-semibold text-white hover:bg-navy">
                            Sačuvaj
                          </button>
                        </form>
                        <form action={removePair}>
                          <input type="hidden" name="group_id" value={g.id} />
                          <input type="hidden" name="team_id" value={p.teamId} />
                          <button className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                            Skini
                          </button>
                        </form>
                      </div>
                    ))}
                    {pairs.length === 0 && <p className="px-4 text-sm text-muted">Nema parova u grupi.</p>}
                  </div>
                </div>
              );
            })}
            {groups.length === 0 && <p className="text-muted">Dodaj bar jednu grupu da bi upisivao parove.</p>}
          </div>
        </>
      )}
    </div>
  );
}
