import { getClubs, getLeagues } from "@/lib/data";
import { getResultEntryData } from "@/lib/admin-data";
import { LeagueAdmin } from "./LeagueAdmin";
import { LeaguesEdit, type EditLeague } from "./LeaguesEdit";

export const dynamic = "force-dynamic";

export default async function AdminLeaguesPage() {
  const [clubs, { leagues }, allLeagues] = await Promise.all([
    getClubs(),
    getResultEntryData(),
    getLeagues(),
  ]);
  const clubName = new Map(clubs.map((c) => [c.id, c.name]));

  const editLeagues: EditLeague[] = allLeagues
    .map((l) => ({
      clubId: l.clubId,
      id: l.id,
      name: l.name,
      status: l.status ?? "active",
      description: l.description ?? "",
      rules: l.rules ?? "",
      clubName: clubName.get(l.clubId) ?? "",
    }))
    .sort((a, b) => b.name.localeCompare(a.name, "sr"));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Lige i kola</h1>
        <p className="mt-2 text-muted">Kreiraj ligu sa automatskim kolima, dodaj kolo/vanredno, ili izmeni postojeće lige.</p>
      </div>

      <LeagueAdmin
        clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
        leagues={leagues.map((l) => ({ id: l.id, clubId: l.clubId, name: l.name }))}
      />

      <div>
        <h2 className="font-display text-xl font-bold text-navy">Izmena liga</h2>
        <p className="mt-1 text-sm text-muted">Status (aktivna↔završena), naziv, opis, pravila.</p>
        <div className="mt-5">
          <LeaguesEdit leagues={editLeagues} />
        </div>
      </div>
    </div>
  );
}
