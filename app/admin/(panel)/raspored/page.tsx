import Link from "next/link";
import {
  getResultEntryData,
  getLeagueScheduleData,
  teamNameKey,
  type LeagueScheduleData,
} from "@/lib/admin-data";
import { acceptProposal, rejectProposal, clearRoundSchedule, removeConstraint } from "@/app/admin/actions";
import { GenerateForm } from "./GenerateForm";
import { Constraints } from "./Constraints";
import type { TeamOption } from "./TeamSelect";

export const dynamic = "force-dynamic";

const HOURS = [17, 18, 19, 20, 21, 22];
const COURTS = [1, 2, 3, 4, 5, 6];

export default async function RasporedPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; round?: string }>;
}) {
  const sp = await searchParams;
  const leagueKey = sp.league ?? "";
  const roundId = sp.round ? Number(sp.round) : 0;

  const { leagues } = await getResultEntryData();

  let data: LeagueScheduleData | null = null;
  if (leagueKey) {
    const [clubId, leagueId] = leagueKey.split(":").map(Number);
    data = await getLeagueScheduleData(clubId, leagueId);
  }

  const nameOf = (gid: number, tid: number) => data?.teamName[teamNameKey(gid, tid)] ?? `Tim ${tid}`;
  const roundName = (rid: number) => data?.rounds.find((r) => r.id === rid)?.name ?? `Kolo ${rid}`;

  const teamOptions: TeamOption[] = data
    ? data.groups.flatMap((g) =>
        g.teams.map((t) => ({ groupId: g.id, teamId: t.teamId, label: `${t.teamName} · gr. ${g.name}` }))
      )
    : [];

  const roundFixtures = data && roundId ? data.fixtures.filter((f) => f.roundId === roundId) : [];
  const proposed = roundFixtures.filter((f) => f.status === "proposed");
  const accepted = roundFixtures.filter((f) => f.status === "accepted");
  const showing = proposed.length ? proposed : accepted;
  const isProposed = proposed.length > 0;
  const cell = new Map<string, (typeof showing)[number]>();
  for (const f of showing) cell.set(`${f.court}:${f.hour}`, f);

  const fixturesByRound = new Map<number, number>();
  for (const f of data?.fixtures ?? [])
    fixturesByRound.set(f.roundId, (fixturesByRound.get(f.roundId) ?? 0) + 1);

  const roundUnavail = (data?.unavailability ?? []).filter((u) => u.roundId === roundId);
  const roundCancel = (data?.cancellations ?? []).filter((c) => c.roundId === roundId);
  const roundDouble = (data?.doubles ?? []).filter((d) => d.roundId === roundId);
  const roundPref = (data?.preferences ?? []).filter((p) => p.roundId === roundId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Raspored mečeva</h1>
        <p className="mt-2 text-muted">
          Predlog kola na osnovu ranga i ograničenja. Teren 2 = najjači mečevi. Dupli termini idu uzastopno.
        </p>
      </div>

      {/* Izbor lige */}
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

      {data && (
        <>
          {/* Kola */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Kola</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.rounds.map((r) => {
                const cnt = fixturesByRound.get(r.id) ?? 0;
                const active = r.id === roundId;
                return (
                  <Link
                    key={r.id}
                    href={`/admin/raspored?league=${leagueKey}&round=${r.id}`}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-gold bg-gold/15 text-gold-deep"
                        : "border-navy/15 text-navy hover:bg-navy/5"
                    }`}
                  >
                    {r.name}
                    {r.date ? <span className="ml-1 text-xs text-muted">{r.date}</span> : null}
                    {cnt ? <span className="ml-1 text-xs text-gold-deep">· {cnt}</span> : null}
                  </Link>
                );
              })}
              {data.rounds.length === 0 && <p className="text-sm text-muted">Liga nema definisana kola.</p>}
            </div>
          </div>

          {roundId > 0 && (
            <>
              {/* Akcije */}
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-navy/8 bg-cream-2 p-4">
                <GenerateForm leagueKey={leagueKey} roundId={roundId} />
                {isProposed && (
                  <>
                    <form action={acceptProposal}>
                      <input type="hidden" name="round_id" value={roundId} />
                      <button className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
                        Prihvati raspored
                      </button>
                    </form>
                    <form action={rejectProposal}>
                      <input type="hidden" name="round_id" value={roundId} />
                      <button className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5">
                        Odbij predlog
                      </button>
                    </form>
                  </>
                )}
                {!isProposed && accepted.length > 0 && (
                  <form action={clearRoundSchedule}>
                    <input type="hidden" name="round_id" value={roundId} />
                    <button className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                      Poništi prihvaćen raspored
                    </button>
                  </form>
                )}
                <span className="text-sm text-muted">
                  {isProposed
                    ? `Predlog: ${proposed.length} mečeva (nije prihvaćen)`
                    : accepted.length
                      ? `Prihvaćeno: ${accepted.length} mečeva`
                      : "Nema rasporeda za ovo kolo"}
                </span>
              </div>

              {/* Mreža teren × sat */}
              {showing.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-navy/8 bg-paper shadow-[var(--shadow-soft)]">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border-b border-navy/10 px-3 py-2 text-left text-xs uppercase tracking-wider text-muted">
                          Sat
                        </th>
                        {COURTS.map((c) => (
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
                      {HOURS.map((h) => (
                        <tr key={h} className="align-top">
                          <td className="border-b border-navy/8 px-3 py-2 font-semibold text-navy">{h}:00</td>
                          {COURTS.map((c) => {
                            const f = cell.get(`${c}:${h}`);
                            return (
                              <td key={c} className="border-b border-navy/8 px-3 py-2">
                                {f ? (
                                  <span className="text-navy">
                                    {nameOf(f.groupId, f.team1Id)}
                                    <span className="text-muted"> vs </span>
                                    {nameOf(f.groupId, f.team2Id)}
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
              )}

              {/* Ograničenja */}
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-navy">Ograničenja za {roundName(roundId)}</h2>
                <Constraints leagueKey={leagueKey} teams={teamOptions} rounds={data.rounds} />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ConstraintList
                    title="Nedostupne ekipe"
                    table="team_unavailability"
                    rows={roundUnavail.map((u) => ({
                      id: u.id,
                      label: `${nameOf(u.groupId, u.teamId)}${u.hour ? ` · ${u.hour}:00` : " · ceo termin"}`,
                    }))}
                  />
                  <ConstraintList
                    title="Otkazani mečevi"
                    table="match_cancellations"
                    rows={roundCancel.map((c) => ({ id: c.id, label: nameOf(c.groupId, c.teamId) }))}
                  />
                  <ConstraintList
                    title="Dupli termini"
                    table="team_double_requests"
                    rows={roundDouble.map((d) => ({ id: d.id, label: nameOf(d.groupId, d.teamId) }))}
                  />
                  <ConstraintList
                    title="Željeni termini"
                    table="team_preference"
                    rows={roundPref.map((p) => ({
                      id: p.id,
                      label: `${nameOf(p.groupId, p.teamId)}${p.hour ? ` · ${p.hour}:00` : ""}`,
                    }))}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ConstraintList({
  title,
  table,
  rows,
}: {
  title: string;
  table: string;
  rows: { id: number; label: string }[];
}) {
  return (
    <div className="rounded-xl border border-navy/8 bg-cream-2 p-4">
      <h4 className="text-sm font-bold text-navy">{title}</h4>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-muted">Nema unosa za ovo kolo.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm text-navy">
              <span>{r.label}</span>
              <form action={removeConstraint}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="table" value={table} />
                <button className="text-xs text-red-600 hover:underline">ukloni</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
