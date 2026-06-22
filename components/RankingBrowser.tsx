"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";

export type RankRow = { playerId: number; name: string; points: number };

export function RankingBrowser({ rows }: { rows: RankRow[] }) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? rows.filter((r) => r.name.toLowerCase().includes(needle)) : rows;
  }, [rows, q]);

  const shown = filtered.slice(0, limit);

  return (
    <div>
      <div className="relative mb-6 max-w-md">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setLimit(50); }}
          placeholder="Pretraži igrača…"
          className="w-full rounded-full border border-navy/12 bg-paper py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-navy/8 bg-paper shadow-[var(--shadow-soft)]">
        {shown.map((r) => {
          const rank = rows.indexOf(r) + 1;
          return (
            <Link
              key={r.playerId}
              href={`/igraci/${r.playerId}`}
              className="flex items-center gap-4 border-b border-navy/5 px-5 py-3 transition last:border-0 hover:bg-cream-2/60"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  rank === 1 ? "bg-gold text-ink" : rank <= 3 ? "bg-gold/15 text-gold-deep" : "text-muted"
                }`}
              >
                {rank}
              </span>
              <Avatar name={r.name} size={36} />
              <span className="flex-1 truncate font-medium text-navy">{r.name}</span>
              <span className="font-display font-bold text-navy">
                {r.points}
                <span className="ml-1 text-xs font-normal text-muted">bod.</span>
              </span>
            </Link>
          );
        })}
      </div>

      {limit < filtered.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setLimit((l) => l + 50)}
            className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5"
          >
            Učitaj još
          </button>
        </div>
      )}
    </div>
  );
}
