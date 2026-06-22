import { getResultEntryData, getRecentMatches } from "@/lib/admin-data";
import { deleteMatch } from "@/app/admin/actions";
import { ResultEntry } from "./ResultEntry";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const [data, matches] = await Promise.all([getResultEntryData(), getRecentMatches(30)]);

  // Lookup naziva ekipa po (grupa:tim) i naziva grupe.
  const teamName = new Map<string, string>();
  for (const [gid, teams] of Object.entries(data.teamsByGroup)) {
    for (const t of teams) teamName.set(`${gid}:${t.teamId}`, t.teamName);
  }
  const groupName = new Map(data.groups.map((g) => [g.id, g.name]));
  const tn = (groupId: number, teamId: number) =>
    teamName.get(`${groupId}:${teamId}`) ?? `Tim ${teamId}`;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Unos rezultata</h1>
        <p className="mt-2 text-muted">
          Bodovanje: pobeda <b className="text-navy">2</b>, poraz <b className="text-navy">1</b>. Predaja:
          pobednik 2, predao 0 (bez gem/set količnika).
        </p>
      </div>

      <ResultEntry data={data} />

      <div>
        <h2 className="font-display text-lg font-bold text-navy">Uneti mečevi</h2>
        <p className="mt-1 text-sm text-muted">
          Poništavanje vraća tabelu na prethodno stanje (oduzima bodove i mečeve).
        </p>
        {matches.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Još nema unetih mečeva.</p>
        ) : (
          <div className="mt-4 divide-y divide-navy/8 overflow-hidden rounded-2xl border border-navy/8 bg-paper shadow-[var(--shadow-soft)]">
            {matches.map((m) => {
              const score = m.walkover
                ? "predaja (6:0 6:0)"
                : m.sets.map((s) => `${s[0]}:${s[1]}`).join("  ");
              const t1 = tn(m.groupId, m.team1Id);
              const t2 = tn(m.groupId, m.team2Id);
              const winnerName = tn(m.groupId, m.winnerTeamId);
              return (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-navy">
                      {t1} <span className="text-muted">vs</span> {t2}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      Grupa {groupName.get(m.groupId) ?? m.groupId} · {score} · pobednik:{" "}
                      <b className="text-gold-deep">{winnerName}</b>
                      {m.playedOn ? ` · ${m.playedOn}` : ""}
                      {m.note ? ` · ${m.note}` : ""}
                    </div>
                  </div>
                  <form action={deleteMatch}>
                    <input type="hidden" name="match_id" value={m.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Poništi
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
