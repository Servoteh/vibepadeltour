import type { TeamProfile as TP } from "@/lib/admin-data";

export function TeamProfile({ profile }: { profile: TP }) {
  const { stats, matches, history } = profile;
  const cards = [
    { label: "Odigrano", value: stats.played },
    { label: "Pobeda", value: stats.won },
    { label: "Procenat", value: `${stats.winPct}%` },
    { label: "Bodova", value: stats.points },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-navy/8 bg-paper p-5 text-center shadow-[var(--shadow-soft)]"
          >
            <div className="font-display text-3xl font-bold text-navy">{c.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-lg font-bold text-navy">Odigrani mečevi</h3>
          {matches.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Još nema unetih mečeva.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {matches.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-navy/8 bg-paper px-4 py-2 text-sm shadow-[var(--shadow-soft)]"
                >
                  <span className="text-navy">vs {m.opponent}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-muted">{m.score}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        m.result === "W" ? "bg-green-600/15 text-green-700" : "bg-navy/8 text-muted"
                      }`}
                    >
                      {m.result === "W" ? "Pobeda" : "Poraz"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-navy">Prijave i otkazivanja</h3>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nema zabeleženih prijava.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((h, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-navy/8 bg-paper px-4 py-2 text-sm shadow-[var(--shadow-soft)]"
                >
                  <span className="font-medium text-navy">{h.kind}</span>
                  <span className="text-muted">
                    {h.round}
                    {h.detail ? ` · ${h.detail}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
