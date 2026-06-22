"use client";

import { useState } from "react";
import { StandingsTable } from "./StandingsTable";
import { Badge } from "./ui";
import type { Group, Standing, Round } from "@/lib/types";

type Tab = "plasman" | "raspored" | "pravila";

const DAYS = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];
const MONTHS = [
  "jan", "feb", "mar", "apr", "maj", "jun",
  "jul", "avg", "sep", "okt", "nov", "dec",
];

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}.`;
}

export function LeagueView({
  groups,
  standingsByGroup,
  rounds,
  rules,
}: {
  groups: Group[];
  standingsByGroup: Record<number, Standing[]>;
  rounds: Round[];
  rules: string;
}) {
  const [tab, setTab] = useState<Tab>("plasman");

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "plasman", label: "Plasman", show: groups.length > 0 },
    { id: "raspored", label: "Raspored kola", show: rounds.length > 0 },
    { id: "pravila", label: "Pravila", show: !!rules && rules.trim() !== "Uskoro..." },
  ];
  const visible = tabs.filter((t) => t.show);

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-navy/10">
        {visible.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px rounded-t-lg px-5 py-3 text-sm font-semibold transition ${
              tab === t.id
                ? "border-b-2 border-gold text-navy"
                : "text-muted hover:text-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "plasman" && (
          <div className="space-y-10">
            {groups.map((g) => (
              <div key={g.id}>
                <div className="mb-3 flex items-center gap-3">
                  <Badge tone="gold">Grupa</Badge>
                  <h3 className="font-display text-lg font-bold text-navy">{g.name}</h3>
                </div>
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-navy/8 bg-paper shadow-[var(--shadow-soft)]">
                  <StandingsTable rows={standingsByGroup[g.id] ?? []} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "raspored" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rounds.map((r) => (
              <div
                key={r.id}
                className="rounded-[var(--radius-card)] border border-navy/8 bg-paper p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-navy">{r.name}</h4>
                  <Badge tone={r.status === "active" ? "lime" : "muted"}>
                    {r.status === "active" ? "Aktivno" : "Završeno"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted">{formatDate(r.date)}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                  <span>🕐 {r.start_hour}–{r.end_hour}h</span>
                  <span>🎾 {r.courts?.length ?? 0} terena</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "pravila" && (
          <div className="rounded-[var(--radius-card)] border border-navy/8 bg-paper p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-navy/80">
              {rules}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
