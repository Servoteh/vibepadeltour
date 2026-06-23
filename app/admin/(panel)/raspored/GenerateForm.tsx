"use client";

import { useActionState } from "react";
import { generateProposal, type ActionState } from "@/app/admin/actions";

export function GenerateForm({ leagueKey, roundId }: { leagueKey: string; roundId: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(generateProposal, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="league" value={leagueKey} />
      <input type="hidden" name="round_id" value={roundId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] transition hover:bg-gold-bright disabled:opacity-60"
      >
        {pending ? "Računam…" : "Generiši predlog kola"}
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.message && <span className="text-sm text-green-700">{state.message}</span>}
    </form>
  );
}
