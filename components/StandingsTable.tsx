import Link from "next/link";
import type { Standing } from "@/lib/types";

function rankBadge(i: number): string {
  if (i === 0) return "bg-gold text-ink";
  if (i === 1) return "bg-navy/10 text-navy";
  if (i === 2) return "bg-gold-deep/20 text-gold-deep";
  return "bg-transparent text-muted";
}

export function StandingsTable({ rows }: { rows: Standing[] }) {
  if (rows.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">Nema podataka o plasmanu.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-wider text-muted">
            <th className="px-3 py-3 font-semibold">#</th>
            <th className="px-3 py-3 font-semibold">Ekipa</th>
            <th className="px-3 py-3 text-center font-semibold" title="Odigrano">OD</th>
            <th className="px-3 py-3 text-center font-semibold" title="Pobede">P</th>
            <th className="px-3 py-3 text-center font-semibold" title="Set razlika">SET</th>
            <th className="px-3 py-3 text-center font-semibold" title="Gem razlika">GEM</th>
            <th className="px-3 py-3 text-center font-semibold">Bodovi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.teamId}
              className="border-b border-navy/5 transition hover:bg-cream-2/60"
            >
              <td className="px-3 py-3">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankBadge(i)}`}
                >
                  {i + 1}
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-col">
                  <Link
                    href={`/igraci/${r.player1Id}`}
                    className="font-medium text-navy hover:text-sea-deep"
                  >
                    {r.player1Name}
                  </Link>
                  <Link
                    href={`/igraci/${r.player2Id}`}
                    className="text-muted hover:text-sea-deep"
                  >
                    {r.player2Name}
                  </Link>
                </div>
              </td>
              <td className="px-3 py-3 text-center text-muted">{r.matchesPlayed}</td>
              <td className="px-3 py-3 text-center font-medium">{r.matchesWon}</td>
              <td className="px-3 py-3 text-center text-muted">
                {r.setsDiff > 0 ? `+${r.setsDiff}` : r.setsDiff}
              </td>
              <td className="px-3 py-3 text-center text-muted">
                {r.gamesDiff > 0 ? `+${r.gamesDiff}` : r.gamesDiff}
              </td>
              <td className="px-3 py-3 text-center">
                <span className="font-display font-bold text-navy">{r.points}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
