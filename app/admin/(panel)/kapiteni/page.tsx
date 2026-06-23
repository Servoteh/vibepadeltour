import { headers } from "next/headers";
import { getResultEntryData } from "@/lib/admin-data";
import { supabaseAdmin } from "@/lib/supabase";
import { CaptainsAdmin } from "./CaptainsAdmin";

export const dynamic = "force-dynamic";

export default async function KapiteniPage() {
  const sb = supabaseAdmin();
  const [{ leagues, groups, teamsByGroup }, capsRes, stRes, h] = await Promise.all([
    getResultEntryData(),
    sb.from("captains").select("*"),
    sb.from("standings").select("team_id, team_name"),
    headers(),
  ]);

  const host = h.get("host") ?? "vibepadeltour.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const activeLeagues = leagues.filter((l) => l.status !== "finished");
  const leagueName = new Map(leagues.map((l) => [`${l.clubId}:${l.id}`, l.name]));
  const teamNameById = new Map<number, string>();
  for (const s of stRes.data ?? []) teamNameById.set(s.team_id as number, (s.team_name as string) ?? "");

  // Ekipe po (aktivnoj) ligi za select.
  const teamsByLeague: Record<string, { value: string; label: string }[]> = {};
  for (const l of activeLeagues) {
    const key = `${l.clubId}:${l.id}`;
    const gs = groups.filter((g) => g.clubId === l.clubId && g.leagueId === l.id);
    teamsByLeague[key] = gs.flatMap((g) =>
      (teamsByGroup[g.id] ?? []).map((t) => ({
        value: `${g.id}:${t.teamId}`,
        label: `${t.teamName} · gr. ${g.name}`,
      }))
    );
  }

  const captains = (capsRes.data ?? []).map((c) => ({
    id: c.id as number,
    teamName: teamNameById.get(c.team_id as number) || `Tim ${c.team_id}`,
    leagueName: leagueName.get(`${c.club_id}:${c.league_id}`) ?? "",
    email: (c.email as string) ?? "",
    link: `${base}/kapiten/${c.token as string}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Kapiteni</h1>
        <p className="mt-2 text-muted">
          Kreiraj kapitena za ekipu i podeli mu link. Kapiten sam unosi dostupnost (sa limitima).
        </p>
      </div>
      <CaptainsAdmin
        leagues={activeLeagues.map((l) => ({ key: `${l.clubId}:${l.id}`, name: l.name }))}
        teamsByLeague={teamsByLeague}
        captains={captains}
      />
    </div>
  );
}
