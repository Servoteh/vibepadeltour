import Link from "next/link";
import { Badge } from "./ui";
import type { League } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  active: "U toku",
  finished: "Završena",
  upcoming: "Uskoro",
};

export function LeagueCard({
  league,
  clubName,
  teams,
  groups,
}: {
  league: League;
  clubName?: string;
  teams?: number;
  groups?: number;
}) {
  const firstLine = league.description?.split("\n")[0]?.slice(0, 150);
  return (
    <Link
      href={`/lige/${league.clubId}/${league.id}`}
      className="group flex flex-col rounded-[var(--radius-card)] border border-navy/8 bg-paper p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-gold/40 hover:shadow-[var(--shadow-gold)]"
    >
      <div className="flex items-center justify-between gap-3">
        {clubName && <Badge tone="sea">{clubName}</Badge>}
        {league.status && (
          <Badge tone={league.status === "active" ? "lime" : "muted"}>
            {STATUS_LABEL[league.status] ?? league.status}
          </Badge>
        )}
      </div>
      <h3 className="font-display mt-4 text-xl font-bold leading-snug text-navy group-hover:text-gold-deep">
        {league.name}
      </h3>
      {firstLine && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{firstLine}…</p>
      )}
      <div className="mt-auto flex items-center gap-5 pt-6 text-sm">
        {groups != null && (
          <span className="text-muted">
            <span className="font-display font-bold text-navy">{groups}</span> grupa
          </span>
        )}
        {teams != null && (
          <span className="text-muted">
            <span className="font-display font-bold text-navy">{teams}</span> ekipa
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-gold-deep">
          Detaljnije
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition group-hover:translate-x-1">
            <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
