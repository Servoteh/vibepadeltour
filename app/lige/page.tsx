import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";
import { LeagueCard } from "@/components/LeagueCard";
import { getClubs, getLeaguesForClub, getGroups, getStandings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Lige",
  description: "Sve lige i sezone u okviru Vibe Padel Tour-a — grupe, plasmani i raspored.",
};

export default function LigePage() {
  const clubs = getClubs();

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="Takmičenja"
        title="Lige i sezone"
        subtitle="Prati grupe, plasmane i raspored kola za sve lige Vibe Padel Tour-a."
      />

      <div className="mt-12 space-y-16">
        {clubs.map((club) => {
          const leagues = getLeaguesForClub(club.id);
          if (leagues.length === 0) return null;
          return (
            <div key={club.id}>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 font-bold text-gold-deep">
                  {club.name.charAt(0)}
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy">{club.name}</h2>
                  {club.description && (
                    <p className="text-sm text-muted">{club.description.split("\n")[0].slice(0, 90)}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {leagues.map((l) => (
                  <LeagueCard
                    key={l.id}
                    league={l}
                    clubName={club.name}
                    groups={getGroups(l.clubId, l.id).length}
                    teams={getStandings(l.clubId, l.id).length}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
