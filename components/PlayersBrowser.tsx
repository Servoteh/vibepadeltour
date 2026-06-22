"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";

export type PlayerLite = {
  id: number;
  name: string;
  points: number;
};

export function PlayersBrowser({ players }: { players: PlayerLite[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"az" | "points">("az");
  const [limit, setLimit] = useState(60);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = players;
    if (needle) list = list.filter((p) => p.name.toLowerCase().includes(needle));
    list = [...list].sort((a, b) =>
      sort === "points"
        ? b.points - a.points || a.name.localeCompare(b.name, "sr")
        : a.name.localeCompare(b.name, "sr")
    );
    return list;
  }, [players, q, sort]);

  const shown = filtered.slice(0, limit);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            width="18" height="18" viewBox="0 0 24 24" fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(60);
            }}
            placeholder="Pretraži igrače…"
            className="w-full rounded-full border border-navy/12 bg-paper py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSort("az")}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
              sort === "az" ? "bg-ink text-white" : "border border-navy/12 text-muted hover:text-navy"
            }`}
          >
            A–Š
          </button>
          <button
            onClick={() => setSort("points")}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
              sort === "points" ? "bg-ink text-white" : "border border-navy/12 text-muted hover:text-navy"
            }`}
          >
            Po bodovima
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "igrač" : "igrača"}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <Link
            key={p.id}
            href={`/igraci/${p.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-navy/8 bg-paper p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-gold/40"
          >
            <Avatar name={p.name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-navy group-hover:text-gold-deep">
                {p.name}
              </div>
              <div className="text-xs text-muted">{p.points} bodova</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-muted transition group-hover:translate-x-1 group-hover:text-gold">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>

      {limit < filtered.length && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setLimit((l) => l + 60)}
            className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5"
          >
            Učitaj još
          </button>
        </div>
      )}
    </div>
  );
}
