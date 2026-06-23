"use client";

import { useState } from "react";
import { useActionState } from "react";
import { addPair, type ActionState } from "@/app/admin/actions";

const field =
  "rounded-lg border border-navy/15 bg-paper px-3 py-2 text-sm text-navy outline-none focus:border-gold/60";

type Player = { id: number; name: string };
type Group = { id: number; name: string };

export function PairAdder({
  leagueKey,
  groups,
  players,
}: {
  leagueKey: string;
  groups: Group[];
  players: Player[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addPair, undefined);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [name, setName] = useState("");
  const [edited, setEdited] = useState(false);

  const nameOf = (id: string) => players.find((p) => String(p.id) === id)?.name ?? "";
  const auto = p1 && p2 ? `${nameOf(p1)} / ${nameOf(p2)}` : "";
  const shownName = edited ? name : auto;

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-2xl border border-navy/8 bg-cream-2 p-4">
      <input type="hidden" name="league" value={leagueKey} />
      <div>
        <label className="block text-xs text-muted">Grupa</label>
        <select name="group_id" className={`${field} w-28`} defaultValue="">
          <option value="">—</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted">Igrač 1</label>
        <select
          name="player1_id"
          value={p1}
          onChange={(e) => {
            setP1(e.target.value);
            setEdited(false);
          }}
          className={`${field} w-44`}
        >
          <option value="">—</option>
          {players.map((p) => (
            <option key={p.id} value={p.id} disabled={String(p.id) === p2}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted">Igrač 2</label>
        <select
          name="player2_id"
          value={p2}
          onChange={(e) => {
            setP2(e.target.value);
            setEdited(false);
          }}
          className={`${field} w-44`}
        >
          <option value="">—</option>
          {players.map((p) => (
            <option key={p.id} value={p.id} disabled={String(p.id) === p1}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs text-muted">Naziv para</label>
        <input
          name="name"
          value={shownName}
          onChange={(e) => {
            setName(e.target.value);
            setEdited(true);
          }}
          placeholder="auto: Ime1 / Ime2"
          className={`${field} w-full`}
        />
      </div>
      <button
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] hover:bg-gold-bright disabled:opacity-60"
      >
        {pending ? "…" : "Upiši par"}
      </button>
      {state?.error && <span className="w-full text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="w-full text-sm text-green-700">{state.message ?? "Upisano."}</span>}
    </form>
  );
}
