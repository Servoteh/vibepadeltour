// Admin-only čitanje (server-side, service_role — zaobilazi RLS).
// Nikada se ne sme uvoziti u klijentske komponente.
import { supabaseAdmin } from "./supabase";
import { clean, getTeams, getRanking } from "./data";
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

// ——————————————————— Raspored (Faza 3) ———————————————————

export type SchedGroup = { id: number; name: string; teams: GroupTeam[] };
export type SchedRound = { id: number; name: string; date: string | null };
export type FixtureRow = {
  id: number;
  groupId: number;
  roundId: number;
  team1Id: number;
  team2Id: number;
  court: number;
  hour: number;
  strength: number;
  status: "proposed" | "accepted";
};
export type ConstraintRow = {
  id: number;
  groupId: number;
  teamId: number;
  roundId: number;
  hour: number | null;
  source: string;
};

export type LeagueScheduleData = {
  groups: SchedGroup[];
  rounds: SchedRound[];
  teamName: Record<number, string>; // "groupId:teamId" -> ime ekipe (kao string ključ)
  fixtures: FixtureRow[];
  unavailability: ConstraintRow[];
  cancellations: Omit<ConstraintRow, "hour">[];
  doubles: Omit<ConstraintRow, "hour">[];
  preferences: ConstraintRow[];
};

// teamId -> jačina (zbir bodova oba igrača sa otežane rang liste). Veće = jači tim.
export async function getTeamStrengthMap(): Promise<Map<number, number>> {
  const [teams, ranking] = await Promise.all([getTeams(), getRanking()]);
  const pts = new Map(ranking.map((r) => [r.playerId, r.points]));
  const strength = new Map<number, number>();
  for (const t of teams) {
    strength.set(t.id, (pts.get(t.player1Id) ?? 0) + (pts.get(t.player2Id) ?? 0));
  }
  return strength;
}

export async function getLeagueScheduleData(
  clubId: number,
  leagueId: number
): Promise<LeagueScheduleData> {
  const sb = supabaseAdmin();
  const [gr, rd, st] = await Promise.all([
    sb.from("groups").select("id, name").eq("club_id", clubId).eq("league_id", leagueId).order("name"),
    sb.from("rounds").select("id, name, date").eq("club_id", clubId).eq("league_id", leagueId).order("date"),
    sb.from("standings").select("group_id, team_id, team_name").eq("club_id", clubId).eq("league_id", leagueId),
  ]);
  if (gr.error) throw new Error(`groups: ${gr.error.message}`);
  if (rd.error) throw new Error(`rounds: ${rd.error.message}`);
  if (st.error) throw new Error(`standings: ${st.error.message}`);

  const teamsByGroup: Record<number, GroupTeam[]> = {};
  const teamName: Record<number, string> = {};
  for (const s of st.data ?? []) {
    const gid = s.group_id as number;
    const tid = s.team_id as number;
    const nm = clean(s.team_name as string) || `Tim ${tid}`;
    (teamsByGroup[gid] ??= []).push({ teamId: tid, teamName: nm });
    teamName[gid * 100000 + tid] = nm; // jednostavan kompozitni ključ
  }

  const groups: SchedGroup[] = (gr.data ?? []).map((g) => ({
    id: g.id as number,
    name: clean(g.name as string),
    teams: (teamsByGroup[g.id as number] ?? []).sort((a, b) =>
      a.teamName.localeCompare(b.teamName, "sr")
    ),
  }));

  const roundIds = (rd.data ?? []).map((r) => r.id as number);
  const inRounds = roundIds.length ? roundIds : [-1];
  const [fx, un, ca, db, pr] = await Promise.all([
    sb.from("fixtures").select("*").eq("club_id", clubId).eq("league_id", leagueId),
    sb.from("team_unavailability").select("*").in("round_id", inRounds),
    sb.from("match_cancellations").select("*").in("round_id", inRounds),
    sb.from("team_double_requests").select("*").in("round_id", inRounds),
    sb.from("team_preference").select("*").in("round_id", inRounds),
  ]);
  if (fx.error) throw new Error(`fixtures: ${fx.error.message}`);
  if (un.error) throw new Error(`unavailability: ${un.error.message}`);
  if (ca.error) throw new Error(`cancellations: ${ca.error.message}`);
  if (db.error) throw new Error(`doubles: ${db.error.message}`);
  if (pr.error) throw new Error(`preferences: ${pr.error.message}`);

  return {
    groups,
    rounds: (rd.data ?? []).map((r) => ({
      id: r.id as number,
      name: clean(r.name as string),
      date: (r.date as string) ?? null,
    })),
    teamName,
    fixtures: (fx.data ?? []).map((f) => ({
      id: f.id as number,
      groupId: f.group_id as number,
      roundId: f.round_id as number,
      team1Id: f.team1_id as number,
      team2Id: f.team2_id as number,
      court: f.court as number,
      hour: f.hour as number,
      strength: Number(f.strength ?? 0),
      status: f.status as "proposed" | "accepted",
    })),
    unavailability: (un.data ?? []).map((u) => ({
      id: u.id as number,
      groupId: u.group_id as number,
      teamId: u.team_id as number,
      roundId: u.round_id as number,
      hour: (u.hour as number) ?? null,
      source: (u.source as string) ?? "admin",
    })),
    cancellations: (ca.data ?? []).map((c) => ({
      id: c.id as number,
      groupId: c.group_id as number,
      teamId: c.team_id as number,
      roundId: c.round_id as number,
      source: (c.source as string) ?? "admin",
    })),
    doubles: (db.data ?? []).map((d) => ({
      id: d.id as number,
      groupId: d.group_id as number,
      teamId: d.team_id as number,
      roundId: d.round_id as number,
      source: (d.source as string) ?? "admin",
    })),
    preferences: (pr.data ?? []).map((p) => ({
      id: p.id as number,
      groupId: p.group_id as number,
      teamId: p.team_id as number,
      roundId: p.round_id as number,
      hour: (p.hour as number) ?? null,
      source: (p.source as string) ?? "admin",
    })),
  };
}

// Ključ za teamName mapu (mora isto i u akciji/strani).
export function teamNameKey(groupId: number, teamId: number): number {
  return groupId * 100000 + teamId;
}
