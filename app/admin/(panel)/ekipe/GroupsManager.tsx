"use client";

import { useActionState } from "react";
import { createGroup, renameGroup, deleteGroup, type ActionState } from "@/app/admin/actions";

const field =
  "rounded-lg border border-navy/15 bg-paper px-3 py-2 text-sm text-navy outline-none focus:border-gold/60";

export function GroupsManager({
  leagueKey,
  groups,
}: {
  leagueKey: string;
  groups: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createGroup, undefined);
  return (
    <div className="space-y-3 rounded-2xl border border-navy/8 bg-cream-2 p-4">
      <h3 className="text-sm font-bold text-navy">Grupe</h3>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="league" value={leagueKey} />
        <input name="name" placeholder="Nova grupa (npr. A)" className={`${field} w-44`} />
        <button
          disabled={pending}
          className="rounded-full bg-navy/90 px-4 py-1.5 text-sm font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {pending ? "…" : "Dodaj grupu"}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="text-sm text-green-700">{state.message ?? "Dodato."}</span>}
      </form>

      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center gap-1 rounded-xl border border-navy/10 bg-paper px-2 py-1">
            <form action={renameGroup} className="flex items-center gap-1">
              <input type="hidden" name="id" value={g.id} />
              <input name="name" defaultValue={g.name} className={`${field} w-24`} />
              <button className="text-xs text-navy hover:underline">preimenuj</button>
            </form>
            <form action={deleteGroup}>
              <input type="hidden" name="id" value={g.id} />
              <button className="text-xs text-red-600 hover:underline">obriši</button>
            </form>
          </div>
        ))}
        {groups.length === 0 && <span className="text-sm text-muted">Nema grupa.</span>}
      </div>
    </div>
  );
}
