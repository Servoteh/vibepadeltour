"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = { id: number; name: string; hasContact: boolean; hasPhoto: boolean };

export function PlayerAdminList({ players }: { players: Row[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return players;
    return players.filter((p) => p.name.toLowerCase().includes(t) || String(p.id) === t);
  }, [q, players]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Pretraži igrače…"
        className="w-full max-w-sm rounded-xl border border-navy/15 bg-paper px-4 py-2.5 text-navy outline-none focus:border-gold/60"
      />
      <p className="mt-2 text-xs text-muted">{filtered.length} od {players.length}</p>

      <div className="mt-4 divide-y divide-navy/8 overflow-hidden rounded-2xl border border-navy/8 bg-paper shadow-[var(--shadow-soft)]">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/admin/igraci/${p.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-navy/5"
          >
            <span className="font-medium text-navy">{p.name}</span>
            <span className="flex items-center gap-2 text-xs text-muted">
              {p.hasPhoto && <span title="Ima sliku">📷</span>}
              {p.hasContact && <span title="Ima kontakt">✉</span>}
              <span className="text-gold-deep">izmeni →</span>
            </span>
          </Link>
        ))}
        {filtered.length === 0 && <p className="px-4 py-6 text-sm text-muted">Nema rezultata.</p>}
      </div>
    </div>
  );
}
