import { getClubs } from "@/lib/data";
import { getResultEntryData } from "@/lib/admin-data";
import { LeagueAdmin } from "./LeagueAdmin";

export const dynamic = "force-dynamic";

export default async function AdminLeaguesPage() {
  const [clubs, { leagues }] = await Promise.all([getClubs(), getResultEntryData()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Lige i kola</h1>
        <p className="mt-2 text-muted">Kreiraj ligu sa automatskim kolima ili dodaj pojedinačno/vanredno kolo.</p>
      </div>
      <LeagueAdmin
        clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
        leagues={leagues.map((l) => ({ id: l.id, clubId: l.clubId, name: l.name }))}
      />
    </div>
  );
}
