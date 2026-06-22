"use client";

import { useMemo, useState } from "react";
import { LeagueCard } from "@/components/LeagueCard";
import type { League } from "@/lib/types";

type LeagueWithCounts = { league: League; groups: number; teams: number };
type ClubWithLeagues = {
  club: { id: number; name: string; description?: string };
  leagues: LeagueWithCounts[];
};

type Tab = "active" | "finished";

const isFinished = (l: League) => l.status === "finished";

export function LeaguesView({ data }: { data: ClubWithLeagues[] }) {
  const [tab, setTab] = useState<Tab>("active");

  const counts = useMemo(() => {
    let active = 0;
    let finished = 0;
    for (const { leagues } of data) {
      for (const { league } of leagues) {
        if (isFinished(league)) finished += 1;
        else active += 1;
      }
    }
    return { active, finished };
  }, [data]);

  const filtered = useMemo(
    () =>
      data
        .map(({ club, leagues }) => ({
          club,
          leagues: leagues.filter(({ league }) =>
            tab === "finished" ? isFinished(league) : !isFinished(league)
          ),
        }))
        .filter(({ leagues }) => leagues.length > 0),
    [data, tab]
  );

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Aktuelne", count: counts.active },
    { key: "finished", label: "Završene", count: counts.finished },
  ];

  return (
    <>
      <div className="mt-10 inline-flex rounded-full border border-navy/10 bg-paper p-1 shadow-[var(--shadow-soft)]">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-gold text-ink shadow-[var(--shadow-gold)]"
                  : "text-muted hover:text-navy"
              }`}
            >
              {t.label}
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                  isActive ? "bg-ink/10 text-ink" : "bg-navy/8 text-navy/60"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 space-y-16">
        {filtered.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-navy/8 bg-paper p-8 text-center text-muted">
            {tab === "finished"
              ? "Još uvek nema završenih liga."
              : "Trenutno nema aktivnih liga. Pogledaj „Završene“ za rezultate prethodnih sezona."}
          </p>
        ) : (
          filtered.map(({ club, leagues }) => (
            <div key={club.id}>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 font-bold text-gold-deep">
                  {club.name.charAt(0)}
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy">{club.name}</h2>
                  {club.description && (
                    <p className="text-sm text-muted">
                      {club.description.split("\n")[0].slice(0, 90)}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {leagues.map(({ league, groups, teams }) => (
                  <LeagueCard
                    key={league.id}
                    league={league}
                    clubName={club.name}
                    groups={groups}
                    teams={teams}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
