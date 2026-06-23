"use client";

import { useActionState } from "react";
import { saveRoundConstraints, type ActionState } from "@/app/admin/actions";

const HOURS = [17, 18, 19, 20, 21, 22];

export type QuickTeam = {
  groupId: number;
  teamId: number;
  name: string;
  groupName: string;
  available: boolean;
  prefHour: number | null;
  dbl: boolean;
};

export function QuickGrid({ roundId, teams }: { roundId: number; teams: QuickTeam[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRoundConstraints, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="round_id" value={roundId} />
      <div className="overflow-x-auto rounded-2xl border border-navy/8 bg-paper shadow-[var(--shadow-soft)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-3 py-2">Ekipa</th>
              <th className="px-3 py-2">Može da igra</th>
              <th className="px-3 py-2">Termin (kad može)</th>
              <th className="px-3 py-2">Dva meča</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.teamId} className="border-t border-navy/8">
                <td className="px-3 py-2">
                  <input type="hidden" name="row" value={`${t.groupId}:${t.teamId}`} />
                  <span className="font-medium text-navy">{t.name}</span>{" "}
                  <span className="text-xs text-muted">gr. {t.groupName}</span>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    name={`can_${t.teamId}`}
                    defaultChecked={t.available}
                    className="h-4 w-4 accent-gold"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    name={`pref_${t.teamId}`}
                    defaultValue={t.prefHour ?? ""}
                    className="rounded-lg border border-navy/15 bg-paper px-2 py-1 text-sm outline-none focus:border-gold/60"
                  >
                    <option value="">—</option>
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}:00
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    name={`dbl_${t.teamId}`}
                    defaultChecked={t.dbl}
                    className="h-4 w-4 accent-gold"
                  />
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-muted">
                  Liga nema ekipa u standings-u.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] hover:bg-gold-bright disabled:opacity-60"
        >
          {pending ? "Čuvam…" : "Sačuvaj sve"}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="text-sm text-green-700">{state.message ?? "Sačuvano."}</span>}
      </div>
    </form>
  );
}
