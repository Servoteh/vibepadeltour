"use client";

import { useActionState } from "react";
import { saveCaptainRound, type CapState } from "./actions";

const HOURS = [17, 18, 19, 20, 21, 22];

export type CaptainRoundRow = {
  id: number;
  name: string;
  date: string | null;
  can: boolean;
  pref: number | null;
  dbl: boolean;
  cancel: boolean;
};

function CaptainRow({ groupId, r }: { groupId: number; r: CaptainRoundRow }) {
  const [state, action, pending] = useActionState<CapState, FormData>(saveCaptainRound, undefined);
  return (
    <form
      action={action}
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-navy/8 bg-paper p-4 shadow-[var(--shadow-soft)]"
    >
      <input type="hidden" name="round_id" value={r.id} />
      <input type="hidden" name="group_id" value={groupId} />
      <div className="min-w-[120px]">
        <div className="font-semibold text-navy">{r.name}</div>
        {r.date && <div className="text-xs text-muted">{r.date}</div>}
      </div>
      <label className="flex items-center gap-2 text-sm text-navy">
        <input type="checkbox" name="can" defaultChecked={r.can} className="h-4 w-4 accent-gold" />
        Možemo
      </label>
      <label className="flex items-center gap-2 text-sm text-navy">
        Termin
        <select
          name="pref"
          defaultValue={r.pref ?? ""}
          className="rounded-lg border border-navy/15 bg-paper px-2 py-1 text-sm outline-none focus:border-gold/60"
        >
          <option value="">—</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-navy">
        <input type="checkbox" name="dbl" defaultChecked={r.dbl} className="h-4 w-4 accent-gold" />
        Dva meča
      </label>
      <label className="flex items-center gap-2 text-sm text-red-700">
        <input type="checkbox" name="cancel" defaultChecked={r.cancel} className="h-4 w-4 accent-red-600" />
        Otkaži
      </label>
      <button
        disabled={pending}
        className="ml-auto rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-bright disabled:opacity-60"
      >
        {pending ? "…" : "Sačuvaj"}
      </button>
      {state?.error && <span className="w-full text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-green-700">✓</span>}
    </form>
  );
}

export function CaptainPanel({ groupId, rounds }: { groupId: number; rounds: CaptainRoundRow[] }) {
  if (rounds.length === 0) return <p className="text-muted">Liga još nema definisana kola.</p>;
  return (
    <div className="space-y-3">
      {rounds.map((r) => (
        <CaptainRow key={r.id} groupId={groupId} r={r} />
      ))}
    </div>
  );
}
