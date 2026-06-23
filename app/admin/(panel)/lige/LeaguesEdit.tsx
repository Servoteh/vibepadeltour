"use client";

import { useActionState } from "react";
import { updateLeague, type ActionState } from "@/app/admin/actions";

const field =
  "w-full rounded-xl border border-navy/15 bg-paper px-3 py-2.5 text-sm text-navy outline-none focus:border-gold/60";

export type EditLeague = {
  clubId: number;
  id: number;
  name: string;
  status: string;
  description: string;
  rules: string;
  clubName: string;
};

function LeagueRow({ l }: { l: EditLeague }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateLeague, undefined);
  return (
    <form action={action} className="space-y-2 rounded-2xl border border-navy/8 bg-paper p-4 shadow-[var(--shadow-soft)]">
      <input type="hidden" name="league" value={`${l.clubId}:${l.id}`} />
      <div className="flex flex-wrap items-center gap-2">
        <input name="name" defaultValue={l.name} className={`${field} flex-1`} />
        <select name="status" defaultValue={l.status || "active"} className={field + " w-40"}>
          <option value="active">Aktivna</option>
          <option value="finished">Završena</option>
        </select>
      </div>
      <textarea name="description" defaultValue={l.description} className={`${field} min-h-[56px]`} placeholder="Opis" />
      <textarea name="rules" defaultValue={l.rules} className={`${field} min-h-[56px]`} placeholder="Pravila" />
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">{l.clubName}</span>
        <button
          disabled={pending}
          className="ml-auto rounded-full bg-navy/90 px-4 py-1.5 text-sm font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {pending ? "Čuvam…" : "Sačuvaj"}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="text-sm text-green-700">✓</span>}
      </div>
    </form>
  );
}

export function LeaguesEdit({ leagues }: { leagues: EditLeague[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {leagues.map((l) => (
        <LeagueRow key={`${l.clubId}:${l.id}`} l={l} />
      ))}
    </div>
  );
}
