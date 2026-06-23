"use client";

import { useActionState } from "react";
import { createClub, updateClub, type ActionState } from "@/app/admin/actions";

const field =
  "w-full rounded-xl border border-navy/15 bg-paper px-3 py-2.5 text-sm text-navy outline-none focus:border-gold/60";
const area = `${field} min-h-[70px]`;

type Club = { id: number; name: string; description: string; rules: string };

function Msg({ state }: { state: ActionState }) {
  if (state?.error) return <span className="text-sm text-red-600">{state.error}</span>;
  if (state?.ok) return <span className="text-sm text-green-700">{state.message ?? "Sačuvano."}</span>;
  return null;
}

function ClubRow({ club }: { club: Club }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateClub, undefined);
  return (
    <form action={action} className="space-y-2 rounded-2xl border border-navy/8 bg-paper p-4 shadow-[var(--shadow-soft)]">
      <input type="hidden" name="id" value={club.id} />
      <input name="name" defaultValue={club.name} className={field} />
      <textarea name="description" defaultValue={club.description} className={area} placeholder="Opis" />
      <textarea name="rules" defaultValue={club.rules} className={area} placeholder="Pravila" />
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-navy/90 px-4 py-1.5 text-sm font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {pending ? "Čuvam…" : "Sačuvaj"}
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}

export function ClubsAdmin({ clubs }: { clubs: Club[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createClub, undefined);
  return (
    <div className="space-y-8">
      <form action={action} className="max-w-xl space-y-2 rounded-[var(--radius-card)] border border-navy/8 bg-cream-2 p-6">
        <h2 className="font-display text-lg font-bold text-navy">Novi klub</h2>
        <input name="name" placeholder="Naziv kluba" className={field} />
        <textarea name="description" placeholder="Opis (opciono)" className={area} />
        <textarea name="rules" placeholder="Pravila (opciono)" className={area} />
        <div className="flex items-center gap-3">
          <button
            disabled={pending}
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] hover:bg-gold-bright disabled:opacity-60"
          >
            {pending ? "Kreiram…" : "Kreiraj klub"}
          </button>
          <Msg state={state} />
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {clubs.map((c) => (
          <ClubRow key={c.id} club={c} />
        ))}
      </div>
    </div>
  );
}
