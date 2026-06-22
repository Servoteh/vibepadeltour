"use client";

import { useActionState, useMemo, useState } from "react";
import { recordMatch, type ActionState } from "@/app/admin/actions";
import type { ResultEntryData, GroupTeam } from "@/lib/admin-data";

const field =
  "w-full rounded-xl border border-navy/15 bg-paper px-3 py-2.5 text-navy outline-none focus:border-gold/60";
const labelCls = "block text-sm font-medium text-navy mb-1.5";

export function ResultEntry({ data }: { data: ResultEntryData }) {
  const { leagues, groups, teamsByGroup } = data;
  const [state, action, pending] = useActionState<ActionState, FormData>(recordMatch, undefined);

  const [leagueKey, setLeagueKey] = useState(""); // "clubId:leagueId"
  const [groupId, setGroupId] = useState("");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [walkover, setWalkover] = useState(false);

  const leagueGroups = useMemo(() => {
    if (!leagueKey) return [];
    const [clubId, leagueId] = leagueKey.split(":").map(Number);
    return groups
      .filter((g) => g.clubId === clubId && g.leagueId === leagueId)
      .sort((a, b) => a.name.localeCompare(b.name, "sr"));
  }, [leagueKey, groups]);

  const teams: GroupTeam[] = groupId ? teamsByGroup[Number(groupId)] ?? [] : [];
  const teamLabel = (id: string) =>
    teams.find((t) => String(t.teamId) === id)?.teamName ?? "";

  return (
    <form action={action} className="space-y-5 rounded-[var(--radius-card)] border border-navy/8 bg-paper p-6 shadow-[var(--shadow-soft)]">
      {/* Liga */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Liga</label>
          <select
            className={field}
            value={leagueKey}
            onChange={(e) => {
              setLeagueKey(e.target.value);
              setGroupId("");
              setTeam1("");
              setTeam2("");
            }}
          >
            <option value="">— izaberi ligu —</option>
            {leagues.map((l) => (
              <option key={`${l.clubId}:${l.id}`} value={`${l.clubId}:${l.id}`}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Grupa</label>
          <select
            name="group_id"
            className={field}
            value={groupId}
            disabled={!leagueKey}
            onChange={(e) => {
              setGroupId(e.target.value);
              setTeam1("");
              setTeam2("");
            }}
          >
            <option value="">— izaberi grupu —</option>
            {leagueGroups.map((g) => (
              <option key={g.id} value={g.id}>
                Grupa {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ekipe */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Ekipa 1</label>
          <select name="team1_id" className={field} value={team1} disabled={!groupId} onChange={(e) => setTeam1(e.target.value)}>
            <option value="">— izaberi ekipu —</option>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId} disabled={String(t.teamId) === team2}>
                {t.teamName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Ekipa 2</label>
          <select name="team2_id" className={field} value={team2} disabled={!groupId} onChange={(e) => setTeam2(e.target.value)}>
            <option value="">— izaberi ekipu —</option>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId} disabled={String(t.teamId) === team1}>
                {t.teamName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Predaja */}
      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          name="walkover"
          checked={walkover}
          onChange={(e) => setWalkover(e.target.checked)}
          className="h-4 w-4 accent-gold"
        />
        Predaja / nepojavljivanje (rezultat 6:0 6:0, pobednik 2 / predao 0 boda, bez gem količnika)
      </label>

      {walkover ? (
        <div>
          <label className={labelCls}>Pobednik</label>
          <select name="winner" className={field} disabled={!team1 || !team2} defaultValue="">
            <option value="">— ko je pobedio —</option>
            {team1 && <option value={team1}>{teamLabel(team1) || "Ekipa 1"}</option>}
            {team2 && <option value={team2}>{teamLabel(team2) || "Ekipa 2"}</option>}
          </select>
        </div>
      ) : (
        <div>
          <label className={labelCls}>Setovi (gemovi: ekipa 1 — ekipa 2)</label>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 text-sm text-muted">Set {i}</span>
                <input name={`set${i}_a`} type="number" min={0} max={20} className={`${field} w-20`} placeholder="0" />
                <span className="text-muted">:</span>
                <input name={`set${i}_b`} type="number" min={0} max={20} className={`${field} w-20`} placeholder="0" />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">Pobednik se određuje po broju dobijenih setova.</p>
        </div>
      )}

      {/* Meta */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Datum (opciono)</label>
          <input name="played_on" type="date" className={field} />
        </div>
        <div>
          <label className={labelCls}>Napomena (opciono)</label>
          <input name="note" className={field} placeholder="npr. odloženo, sudija…" />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-600/10 px-3 py-2 text-sm text-green-700">
          Meč je sačuvan i tabela je ažurirana.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] transition hover:bg-gold-bright disabled:opacity-60"
      >
        {pending ? "Čuvanje…" : "Sačuvaj rezultat"}
      </button>
    </form>
  );
}
