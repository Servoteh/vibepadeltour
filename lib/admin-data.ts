// Admin-only čitanje (server-side, service_role — zaobilazi RLS).
// Nikada se ne sme uvoziti u klijentske komponente.
import { supabaseAdmin } from "./supabase";
import { clean } from "./data";
import type { Player } from "./types";

// Pun zapis igrača UKLJUČUJUĆI email/phone (anon ih ne sme čitati — vidi 02_players_extra.sql).
export async function getPlayerAdmin(id: number): Promise<Player | undefined> {
  const { data, error } = await supabaseAdmin()
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`player ${id}: ${error.message}`);
  if (!data) return undefined;
  return {
    id: data.id as number,
    firstName: clean(data.first_name as string),
    lastName: clean(data.last_name as string),
    dob: (data.dob as string) ?? "",
    gender: (data.gender as string) ?? "",
    photoUrl: (data.photo_url as string) ?? "",
    email: (data.email as string) ?? "",
    phone: (data.phone as string) ?? "",
  };
}

export type GroupTeam = { teamId: number; teamName: string };

export type ResultEntryData = {
  leagues: { id: number; clubId: number; name: string; status: string }[];
  groups: { id: number; clubId: number; leagueId: number; name: string }[];
  teamsByGroup: Record<number, GroupTeam[]>;
};

// Sve što treba formi za unos rezultata: lige, grupe i ekipe po grupama.
export async function getResultEntryData(): Promise<ResultEntryData> {
  const sb = supabaseAdmin();
  const [lg, gr, st] = await Promise.all([
    sb.from("leagues").select("id, club_id, name, status").limit(2000),
    sb.from("groups").select("id, club_id, league_id, name").limit(2000),
    sb.from("standings").select("group_id, team_id, team_name").limit(5000),
  ]);
  if (lg.error) throw new Error(`leagues: ${lg.error.message}`);
  if (gr.error) throw new Error(`groups: ${gr.error.message}`);
  if (st.error) throw new Error(`standings: ${st.error.message}`);

  const teamsByGroup: Record<number, GroupTeam[]> = {};
  for (const s of st.data ?? []) {
    const gid = s.group_id as number;
    (teamsByGroup[gid] ??= []).push({
      teamId: s.team_id as number,
      teamName: clean(s.team_name as string) || `Tim ${s.team_id}`,
    });
  }
  for (const gid of Object.keys(teamsByGroup)) {
    teamsByGroup[+gid].sort((a, b) => a.teamName.localeCompare(b.teamName, "sr"));
  }

  return {
    leagues: (lg.data ?? [])
      .map((l) => ({
        id: l.id as number,
        clubId: l.club_id as number,
        name: clean(l.name as string),
        status: (l.status as string) ?? "",
      }))
      .sort((a, b) => b.name.localeCompare(a.name, "sr")),
    groups: (gr.data ?? []).map((g) => ({
      id: g.id as number,
      clubId: g.club_id as number,
      leagueId: g.league_id as number,
      name: clean(g.name as string),
    })),
    teamsByGroup,
  };
}

export type MatchRow = {
  id: number;
  groupId: number;
  team1Id: number;
  team2Id: number;
  sets: [number, number][];
  winnerTeamId: number;
  walkover: boolean;
  playedOn: string | null;
  note: string;
};

export async function getRecentMatches(limit = 25): Promise<MatchRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("matches")
    .select("*")
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`matches: ${error.message}`);
  return (data ?? []).map((m) => ({
    id: m.id as number,
    groupId: m.group_id as number,
    team1Id: m.team1_id as number,
    team2Id: m.team2_id as number,
    sets: (m.sets as [number, number][]) ?? [],
    winnerTeamId: m.winner_team_id as number,
    walkover: m.walkover as boolean,
    playedOn: (m.played_on as string) ?? null,
    note: (m.note as string) ?? "",
  }));
}
