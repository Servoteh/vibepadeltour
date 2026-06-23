"use client";

import { useActionState } from "react";
import {
  addUnavailability,
  addCancellation,
  addDouble,
  type ActionState,
} from "@/app/admin/actions";
import { TeamSelect, type TeamOption } from "./TeamSelect";

const field =
  "rounded-lg border border-navy/15 bg-paper px-3 py-2 text-sm text-navy outline-none focus:border-gold/60";
const HOURS = [17, 18, 19, 20, 21, 22];

type RoundOpt = { id: number; name: string; date: string | null };

function Status({ state }: { state: ActionState }) {
  if (state?.error) return <span className="text-xs text-red-600">{state.error}</span>;
  if (state?.ok) return <span className="text-xs text-green-700">Sačuvano.</span>;
  return null;
}

export function Constraints({
  leagueKey,
  teams,
  rounds,
}: {
  leagueKey: string;
  teams: TeamOption[];
  rounds: RoundOpt[];
}) {
  const [unState, unAction] = useActionState<ActionState, FormData>(addUnavailability, undefined);
  const [caState, caAction] = useActionState<ActionState, FormData>(addCancellation, undefined);
  const [dbState, dbAction] = useActionState<ActionState, FormData>(addDouble, undefined);

  const roundOptions = rounds.map((r) => (
    <option key={r.id} value={r.id}>
      {r.name}
      {r.date ? ` · ${r.date}` : ""}
    </option>
  ));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Nedostupnost */}
      <form action={unAction} className="space-y-2 rounded-xl border border-navy/8 bg-paper p-4 shadow-[var(--shadow-soft)]">
        <h4 className="text-sm font-bold text-navy">Nedostupnost <span className="font-normal text-muted">(max 3 kola)</span></h4>
        <input type="hidden" name="league" value={leagueKey} />
        <TeamSelect teams={teams} className={`${field} w-full`} />
        <select name="round_id" className={`${field} w-full`} aria-label="Kolo">
          <option value="">— kolo —</option>
          {roundOptions}
        </select>
        <select name="hour" className={`${field} w-full`} aria-label="Sat">
          <option value="">Ceo termin</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
        <div className="flex items-center justify-between gap-2">
          <button className="rounded-full bg-navy/90 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy">
            Dodaj
          </button>
          <Status state={unState} />
        </div>
      </form>

      {/* Otkazivanje */}
      <form action={caAction} className="space-y-2 rounded-xl border border-navy/8 bg-paper p-4 shadow-[var(--shadow-soft)]">
        <h4 className="text-sm font-bold text-navy">Otkazivanje <span className="font-normal text-muted">(max 5, ≥3 dana)</span></h4>
        <input type="hidden" name="league" value={leagueKey} />
        <TeamSelect teams={teams} className={`${field} w-full`} />
        <select name="round_id" className={`${field} w-full`} aria-label="Kolo">
          <option value="">— kolo —</option>
          {roundOptions}
        </select>
        <div className="flex items-center justify-between gap-2">
          <button className="rounded-full bg-navy/90 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy">
            Dodaj
          </button>
          <Status state={caState} />
        </div>
      </form>

      {/* Dupli termin */}
      <form action={dbAction} className="space-y-2 rounded-xl border border-navy/8 bg-paper p-4 shadow-[var(--shadow-soft)]">
        <h4 className="text-sm font-bold text-navy">Dupli termin <span className="font-normal text-muted">(2 meča uzastopno)</span></h4>
        <input type="hidden" name="league" value={leagueKey} />
        <TeamSelect teams={teams} className={`${field} w-full`} />
        <select name="round_id" className={`${field} w-full`} aria-label="Kolo">
          <option value="">— kolo —</option>
          {roundOptions}
        </select>
        <div className="flex items-center justify-between gap-2">
          <button className="rounded-full bg-navy/90 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy">
            Dodaj
          </button>
          <Status state={dbState} />
        </div>
      </form>
    </div>
  );
}
