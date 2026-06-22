import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";
import { LeaguesView } from "@/components/LeaguesView";
import { getClubs, getLeaguesForClub, getGroups, getStandings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Lige",
  description: "Sve lige i sezone u okviru Vibe Padel Tour-a — grupe, plasmani i raspored.",
};


export default async function LigePage() {
  const clubs = await getClubs();
  const clubsWithLeagues = await Promise.all(
    clubs.map(async (club) => {
      const leagues = await getLeaguesForClub(club.id);
      const withCounts = await Promise.all(
        leagues.map(async (l) => {
          const [groups, standings] = await Promise.all([
            getGroups(l.clubId, l.id),
            getStandings(l.clubId, l.id),
          ]);
          return { league: l, groups: groups.length, teams: standings.length };
        })
      );
      return { club, leagues: withCounts };
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="Takmičenja"
        title="Lige i sezone"
        subtitle="Prati grupe, plasmane i raspored kola za sve lige Vibe Padel Tour-a."
      />

      <LeaguesView data={clubsWithLeagues.filter(({ leagues }) => leagues.length > 0)} />
    </div>
  );
}
