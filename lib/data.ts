// Data sloj — čita iz Supabase baze (server-side, anon klijent + RLS javno čitanje).
// Funkcije su asinhrone; tipovi i potpisi su isti kao ranije da strane ostanu jednostavne.
import { supabasePublic } from "./supabase";
import type {
  Player,
  Team,
  RankingEntry,
  Club,
  League,
  Group,
  Standing,
  Round,
} from "./types";
import { rowWeight } from "./ranking";

// ——— Pomoćne ———
export function clean(s: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}
export function playerName(p: { firstName: string; lastName: string }): string {
  return clean(`${p.firstName} ${p.lastName}`);
}
const byName = (a: { firstName: string; lastName: string }, b: typeof a) =>
  playerName(a).localeCompare(playerName(b), "sr");

// ——— Maperi (snake_case → tipovi aplikacije) ———
type Row = Record<string, unknown>;
const sb = () => supabasePublic();

function mapPlayer(r: Row): Player {
  return {
    id: r.id as number,
    firstName: clean(r.first_name as string),
    lastName: clean(r.last_name as string),
    dob: (r.dob as string) ?? "",
  };
}
function mapTeam(r: Row): Team {
  return {
    id: r.id as number,
    player1Id: r.player1_id as number,
    player2Id: r.player2_id as number,
    name: clean(r.name as string),
  };
}
function mapClub(r: Row): Club {
  return {
    id: r.id as number,
    name: r.name as string,
    description: (r.description as string) ?? "",
    rules: (r.rules as string) ?? "",
  };
}
function mapLeague(r: Row): League {
  return {
    id: r.id as number,
    clubId: r.club_id as number,
    name: r.name as string,
    description: (r.description as string) ?? "",
    rules: (r.rules as string) ?? "",
    status: (r.status as string) ?? "",
  };
}
function mapGroup(r: Row): Group {
  return {
    id: r.id as number,
    clubId: r.club_id as number,
    leagueId: r.league_id as number,
    name: r.name as string,
  };
}
function mapStanding(r: Row): Standing {
  return {
    groupId: r.group_id as number,
    teamId: r.team_id as number,
    clubId: r.club_id as number,
    leagueId: r.league_id as number,
    teamName: clean(r.team_name as string),
    player1Id: r.player1_id as number,
    player1Name: clean(r.player1_name as string),
    player2Id: r.player2_id as number,
    player2Name: clean(r.player2_name as string),
    matchesPlayed: r.matches_played as number,
    matchesWon: r.matches_won as number,
    gamesDiff: r.games_diff as number,
    setsDiff: r.sets_diff as number,
    points: r.points as number,
  };
}
function mapRound(r: Row): Round {
  return {
    id: r.id as number,
    clubId: r.club_id as number,
    leagueId: r.league_id as number,
    name: r.name as string,
    date: (r.date as string) ?? "",
    start_hour: (r.start_hour as number) ?? 17,
    end_hour: (r.end_hour as number) ?? 23,
    status: (r.status as string) ?? "",
    courts: (r.courts as Round["courts"]) ?? [],
  };
}

async function fetchAll<T>(table: string, mapper: (r: Row) => T): Promise<T[]> {
  const { data, error } = await sb().from(table).select("*").limit(2000);
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []).map(mapper);
}

// ——— Igrači ———
export async function getPlayers(): Promise<Player[]> {
  const rows = await fetchAll("players", mapPlayer);
  return rows.sort(byName);
}
export async function getPlayer(id: number): Promise<Player | undefined> {
  const { data, error } = await sb().from("players").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`player ${id}: ${error.message}`);
  return data ? mapPlayer(data) : undefined;
}

// ——— Timovi ———
export async function getTeams(): Promise<Team[]> {
  return fetchAll("teams", mapTeam);
}
export async function getTeamsForPlayer(playerId: number): Promise<Team[]> {
  const { data, error } = await sb()
    .from("teams")
    .select("*")
    .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);
  if (error) throw new Error(`teams ${playerId}: ${error.message}`);
  return (data ?? []).map(mapTeam);
}

// ——— Klubovi / lige / grupe ———
export async function getClubs(): Promise<Club[]> {
  const rows = await fetchAll("clubs", mapClub);
  return rows.sort((a, b) => a.id - b.id);
}
export async function getClub(id: number): Promise<Club | undefined> {
  const { data, error } = await sb().from("clubs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`club ${id}: ${error.message}`);
  return data ? mapClub(data) : undefined;
}
export async function getLeagues(): Promise<League[]> {
  return fetchAll("leagues", mapLeague);
}
export async function getLeaguesForClub(clubId: number): Promise<League[]> {
  const { data, error } = await sb().from("leagues").select("*").eq("club_id", clubId);
  if (error) throw new Error(`leagues club ${clubId}: ${error.message}`);
  // Najnovija sezona prva (po nazivu sezone u imenu)
  return (data ?? []).map(mapLeague).sort((a, b) => b.name.localeCompare(a.name, "sr"));
}
export async function getLeague(clubId: number, leagueId: number): Promise<League | undefined> {
  const { data, error } = await sb()
    .from("leagues")
    .select("*")
    .eq("club_id", clubId)
    .eq("id", leagueId)
    .maybeSingle();
  if (error) throw new Error(`league ${leagueId}: ${error.message}`);
  return data ? mapLeague(data) : undefined;
}
export async function getGroups(clubId: number, leagueId: number): Promise<Group[]> {
  const { data, error } = await sb()
    .from("groups")
    .select("*")
    .eq("club_id", clubId)
    .eq("league_id", leagueId)
    .order("name");
  if (error) throw new Error(`groups ${leagueId}: ${error.message}`);
  return (data ?? []).map(mapGroup);
}

// ——— Standings ———
export async function getStandings(clubId: number, leagueId: number): Promise<Standing[]> {
  const { data, error } = await sb()
    .from("standings")
    .select("*")
    .eq("club_id", clubId)
    .eq("league_id", leagueId);
  if (error) throw new Error(`standings ${leagueId}: ${error.message}`);
  return (data ?? []).map(mapStanding);
}
export async function getStandingsForGroup(groupId: number): Promise<Standing[]> {
  const { data, error } = await sb().from("standings").select("*").eq("group_id", groupId);
  if (error) throw new Error(`standings group ${groupId}: ${error.message}`);
  return (data ?? [])
    .map(mapStanding)
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.matchesWon - a.matchesWon ||
        b.setsDiff - a.setsDiff ||
        b.gamesDiff - a.gamesDiff
    );
}
export async function getStandingsForPlayer(playerId: number): Promise<Standing[]> {
  const { data, error } = await sb()
    .from("standings")
    .select("*")
    .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);
  if (error) throw new Error(`standings player ${playerId}: ${error.message}`);
  return (data ?? []).map(mapStanding);
}

// ——— Kola ———
export async function getRounds(clubId: number, leagueId: number): Promise<Round[]> {
  const { data, error } = await sb()
    .from("rounds")
    .select("*")
    .eq("club_id", clubId)
    .eq("league_id", leagueId)
    .order("date");
  if (error) throw new Error(`rounds ${leagueId}: ${error.message}`);
  return (data ?? []).map(mapRound);
}

// ——— Ranking (otežan po jedinstvenoj lestvici jačine — vidi lib/ranking.ts) ———
export type RankingRow = RankingEntry & {
  rawPoints: number;
  matchesWon: number;
  matchesPlayed: number;
};

export async function getRanking(): Promise<RankingRow[]> {
  const [players, leagues, groups, standings] = await Promise.all([
    getPlayers(),
    getLeagues(),
    fetchAll("groups", mapGroup),
    fetchAll("standings", mapStanding),
  ]);

  const leagueName = new Map(leagues.map((l) => [l.id, l.name]));
  const groupName = new Map(groups.map((g) => [g.id, g.name]));

  const agg = new Map<
    number,
    { weighted: number; rawPoints: number; matchesWon: number; matchesPlayed: number }
  >();
  for (const s of standings) {
    const w = rowWeight(leagueName.get(s.leagueId) ?? "", groupName.get(s.groupId) ?? "");
    for (const pid of [s.player1Id, s.player2Id]) {
      if (pid == null) continue;
      const cur = agg.get(pid) ?? { weighted: 0, rawPoints: 0, matchesWon: 0, matchesPlayed: 0 };
      cur.weighted += s.points * w;
      cur.rawPoints += s.points;
      cur.matchesWon += s.matchesWon;
      cur.matchesPlayed += s.matchesPlayed;
      agg.set(pid, cur);
    }
  }

  return players
    .map((p) => {
      const a = agg.get(p.id);
      return {
        playerId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        points: Math.round(a?.weighted ?? 0),
        rawPoints: a?.rawPoints ?? 0,
        matchesWon: a?.matchesWon ?? 0,
        matchesPlayed: a?.matchesPlayed ?? 0,
      };
    })
    .sort((a, b) => b.points - a.points || b.matchesWon - a.matchesWon || byName(a, b));
}

export async function getRankForPlayer(
  playerId: number
): Promise<{ rank: number; points: number } | null> {
  const ranking = await getRanking();
  const idx = ranking.findIndex((r) => r.playerId === playerId);
  if (idx === -1) return null;
  return { rank: idx + 1, points: ranking[idx].points };
}

// ——— Agregati za naslovnu ———
export async function getStats() {
  const head = { count: "exact" as const, head: true };
  const [players, teams, leagues, clubs] = await Promise.all([
    sb().from("players").select("id", head),
    sb().from("teams").select("id", head),
    sb().from("leagues").select("id", head),
    sb().from("clubs").select("id", head),
  ]);
  return {
    players: players.count ?? 0,
    teams: teams.count ?? 0,
    leagues: leagues.count ?? 0,
    clubs: clubs.count ?? 0,
  };
}
