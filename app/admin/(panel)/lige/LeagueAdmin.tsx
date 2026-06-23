"use client";

import { useActionState } from "react";
import { createLeague, createRound, type ActionState } from "@/app/admin/actions";

const field =
  "w-full rounded-xl border border-navy/15 bg-paper px-3 py-2.5 text-sm text-navy outline-none focus:border-gold/60";
const label = "block text-sm font-medium text-navy mb-1";

const WEEKDAYS = [
  { v: 1, n: "Ponedeljak" },
  { v: 2, n: "Utorak" },
  { v: 3, n: "Sreda" },
  { v: 4, n: "Četvrtak" },
  { v: 5, n: "Petak" },
  { v: 6, n: "Subota" },
  { v: 0, n: "Nedelja" },
];

type Club = { id: number; name: string };
type League = { id: number; clubId: number; name: string };

function Msg({ state }: { state: ActionState }) {
  if (state?.error) return <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{state.error}</p>;
  if (state?.ok)
    return (
      <p className="rounded-lg bg-green-600/10 px-3 py-2 text-sm text-green-700">
        {state.message ?? "Sačuvano."}
      </p>
    );
  return null;
}

export function LeagueAdmin({ clubs, leagues }: { clubs: Club[]; leagues: League[] }) {
  const [lgState, lgAction, lgPending] = useActionState<ActionState, FormData>(createLeague, undefined);
  const [rdState, rdAction, rdPending] = useActionState<ActionState, FormData>(createRound, undefined);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Auto-kreiranje lige */}
      <form action={lgAction} className="space-y-3 rounded-[var(--radius-card)] border border-navy/8 bg-paper p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-lg font-bold text-navy">Nova liga (auto kola)</h2>
        <p className="text-sm text-muted">Generiše kolo za svaki izabran dan u nedelji u opsegu datuma.</p>
        <div>
          <label className={label}>Klub</label>
          <select name="club_id" className={field} defaultValue="">
            <option value="">— izaberi klub —</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Naziv lige</label>
          <input name="name" className={field} placeholder="npr. Liga 3 — Leto 2026" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Dan</label>
            <select name="weekday" className={field} defaultValue="3">
              {WEEKDAYS.map((w) => (
                <option key={w.v} value={w.v}>
                  {w.n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Od</label>
            <input name="start_date" type="date" className={field} />
          </div>
          <div>
            <label className={label}>Do</label>
            <input name="end_date" type="date" className={field} />
          </div>
        </div>
        <Msg state={lgState} />
        <button
          disabled={lgPending}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] hover:bg-gold-bright disabled:opacity-60"
        >
          {lgPending ? "Kreiram…" : "Kreiraj ligu"}
        </button>
      </form>

      {/* Dodaj kolo / vanredno kolo */}
      <form action={rdAction} className="space-y-3 rounded-[var(--radius-card)] border border-navy/8 bg-paper p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-lg font-bold text-navy">Dodaj kolo</h2>
        <p className="text-sm text-muted">Redovno ili vanredno kolo u postojeću ligu.</p>
        <div>
          <label className={label}>Liga</label>
          <select name="league" className={field} defaultValue="">
            <option value="">— izaberi ligu —</option>
            {leagues.map((l) => (
              <option key={`${l.clubId}:${l.id}`} value={`${l.clubId}:${l.id}`}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Datum</label>
          <input name="date" type="date" className={field} />
        </div>
        <div>
          <label className={label}>Naziv (opciono)</label>
          <input name="name" className={field} placeholder="auto: Kolo N / Vanredno kolo" />
        </div>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" name="extra" className="h-4 w-4 accent-gold" />
          Vanredno kolo
        </label>
        <Msg state={rdState} />
        <button
          disabled={rdPending}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] hover:bg-gold-bright disabled:opacity-60"
        >
          {rdPending ? "Dodajem…" : "Dodaj kolo"}
        </button>
      </form>
    </div>
  );
}
