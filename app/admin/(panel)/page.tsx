import Link from "next/link";
import { getStats } from "@/lib/data";
import { getRecentMatches } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([getStats(), getRecentMatches(5)]);

  const cards = [
    { label: "Igrača", value: stats.players },
    { label: "Timova", value: stats.teams },
    { label: "Liga", value: stats.leagues },
    { label: "Klubova", value: stats.clubs },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Pregled</h1>
        <p className="mt-2 text-muted">Unesi rezultate i upravljaj podacima tura.</p>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/rezultati"
          className="group rounded-[var(--radius-card)] border border-navy/8 bg-ink p-6 text-white shadow-[var(--shadow-soft)] transition hover:border-gold/40"
        >
          <div className="font-display text-xl font-bold text-gold">Unos rezultata →</div>
          <p className="mt-2 text-sm text-white/60">
            Izaberi ligu, grupu i ekipe. Bodovi i tabela se ažuriraju automatski.
          </p>
        </Link>
        <Link
          href="/admin/igraci"
          className="group rounded-[var(--radius-card)] border border-navy/8 bg-paper p-6 shadow-[var(--shadow-soft)] transition hover:border-gold/40"
        >
          <div className="font-display text-xl font-bold text-navy">Igrači →</div>
          <p className="mt-2 text-sm text-muted">
            Izmena kontakta, pola i fotografije igrača; dodavanje novih.
          </p>
        </Link>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold text-navy">Poslednji uneti mečevi</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Još nema unetih mečeva.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-navy/8 bg-paper px-4 py-2 text-sm text-muted shadow-[var(--shadow-soft)]"
              >
                #{m.id} · grupa {m.groupId} ·{" "}
                {m.walkover ? "predaja" : m.sets.map((s) => `${s[0]}:${s[1]}`).join(" ")} ·
                pobednik tim {m.winnerTeamId}
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/rezultati" className="mt-3 inline-block text-sm text-gold-deep hover:underline">
          Svi mečevi i unos →
        </Link>
      </div>
    </div>
  );
}
