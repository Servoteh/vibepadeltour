"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createCaptain, deleteCaptain, type ActionState } from "@/app/admin/actions";

const field =
  "w-full rounded-xl border border-navy/15 bg-paper px-3 py-2.5 text-sm text-navy outline-none focus:border-gold/60";

type LeagueOpt = { key: string; name: string };
type TeamOpt = { value: string; label: string };
type CaptainRow = {
  id: number;
  teamName: string;
  leagueName: string;
  email: string;
  link: string;
  profileHref: string;
};

export function CaptainsAdmin({
  leagues,
  teamsByLeague,
  captains,
}: {
  leagues: LeagueOpt[];
  teamsByLeague: Record<string, TeamOpt[]>;
  captains: CaptainRow[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createCaptain, undefined);
  const [leagueKey, setLeagueKey] = useState("");
  const teams = leagueKey ? teamsByLeague[leagueKey] ?? [] : [];

  return (
    <div className="space-y-8">
      <form action={action} className="grid max-w-2xl gap-3 rounded-[var(--radius-card)] border border-navy/8 bg-paper p-6 shadow-[var(--shadow-soft)] sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="font-display text-lg font-bold text-navy">Novi kapiten</h2>
          <p className="text-sm text-muted">Generiše magic-link koji deliš kapitenu (email kasnije).</p>
        </div>
        <select
          name="league"
          value={leagueKey}
          onChange={(e) => setLeagueKey(e.target.value)}
          className={field}
        >
          <option value="">— aktivna liga —</option>
          {leagues.map((l) => (
            <option key={l.key} value={l.key}>
              {l.name}
            </option>
          ))}
        </select>
        <select name="team" className={field} disabled={!leagueKey} defaultValue="">
          <option value="">— ekipa —</option>
          {teams.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input name="name" placeholder="Ime kapitena (opciono)" className={field} />
        <input name="email" type="email" placeholder="Email (opciono za sad)" className={field} />
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            disabled={pending}
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] hover:bg-gold-bright disabled:opacity-60"
          >
            {pending ? "Kreiram…" : "Kreiraj kapitena"}
          </button>
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
          {state?.ok && <span className="text-sm text-green-700">{state.message ?? "Sačuvano."}</span>}
        </div>
      </form>

      <div>
        <h2 className="font-display text-lg font-bold text-navy">Kapiteni</h2>
        {captains.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Još nema kapitena.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {captains.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy/8 bg-paper px-4 py-3 shadow-[var(--shadow-soft)]"
              >
                <div className="min-w-[180px]">
                  <div className="text-sm font-semibold text-navy">{c.teamName}</div>
                  <div className="text-xs text-muted">
                    {c.leagueName}
                    {c.email ? ` · ${c.email}` : ""}
                  </div>
                </div>
                <input
                  readOnly
                  value={c.link}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-navy/15 bg-cream-2 px-2 py-1 text-xs text-navy"
                />
                <Link
                  href={c.profileHref}
                  className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5"
                >
                  Profil
                </Link>
                <form action={deleteCaptain}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                    Obriši
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
