// Data sloj — čita snapshot iz data/*.json.
// Apstrahovan tako da se u Fazi 2 lako prebaci na Prisma bez menjanja strana.
import fs from "node:fs";
import path from "node:path";
import type {
  Player,
  Team,
  RankingEntry,
  Club,
  League,
  Group,
  Standing,
  Round,
  ImportMeta,
} from "./types";
import { rowWeight } from "./ranking";

const DATA_DIR = path.join(process.cwd(), "data");

function read<T>(name: string): T {
  const file = path.join(DATA_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

// Imena u izvoru ponekad imaju vodeće/prateće razmake.
export function clean(s: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

export function playerName(p: { firstName: string; lastName: string }): string {
  return clean(`${p.firstName} ${p.lastName}`);
}

// ——— Igrači ———
export function getPlayers(): Player[] {
  return read<Player[]>("players")
    .map((p) => ({ ...p, firstName: clean(p.firstName), lastName: clean(p.lastName) }))
    .sort((a, b) => playerName(a).localeCompare(playerName(b), "sr"));
}

export function getPlayer(id: number): Player | undefined {
  return getPlayers().find((p) => p.id === id);
}

// ——— Timovi ———
export function getTeams(): Team[] {
  return read<Team[]>("teams").map((t) => ({ ...t, name: clean(t.name) }));
}

export function getTeamsForPlayer(playerId: number): Team[] {
  return getTeams().filter((t) => t.player1Id === playerId || t.player2Id === playerId);
}

// ——— Ranking ———
// Zvanični ranking sa API-ja trenutno ima 0 bodova za sve igrače (sezona resetovana),
// pa računamo OTEŽANI ranking iz grupnih plasmana (standings) po igraču:
// bodovi se množe koeficijentom ranga lige (Liga 1>2>3) i divizije (GOLD>SILVER>B>C).
// Metodologija i koeficijenti su u lib/ranking.ts. Kada zvanični ranking dobije
// bodove, automatski se koristi on.
export type RankingRow = RankingEntry & {
  rawPoints: number;
  matchesWon: number;
  matchesPlayed: number;
};

export function getRanking(): RankingRow[] {
  const official = read<RankingEntry[]>("ranking").map((r) => ({
    ...r,
    firstName: clean(r.firstName),
    lastName: clean(r.lastName),
  }));
  const officialHasPoints = official.some((r) => r.points > 0);

  // Mape za naziv lige i grupe (potrebne za koeficijente)
  const leagueName = new Map(getLeagues().map((l) => [`${l.clubId}:${l.id}`, l.name]));
  const groupName = new Map(
    read<Group[]>("groups").map((g) => [g.id, g.name])
  );

  // Agregacija iz standings po igraču (otežani i sirovi bodovi)
  const agg = new Map<
    number,
    { weighted: number; rawPoints: number; matchesWon: number; matchesPlayed: number }
  >();
  for (const s of read<Standing[]>("standings")) {
    const lname = leagueName.get(`${s.clubId}:${s.leagueId}`) ?? "";
    const gname = groupName.get(s.groupId) ?? "";
    const w = rowWeight(lname, gname);
    for (const pid of [s.player1Id, s.player2Id]) {
      const cur =
        agg.get(pid) ?? { weighted: 0, rawPoints: 0, matchesWon: 0, matchesPlayed: 0 };
      cur.weighted += s.points * w;
      cur.rawPoints += s.points;
      cur.matchesWon += s.matchesWon;
      cur.matchesPlayed += s.matchesPlayed;
      agg.set(pid, cur);
    }
  }

  return official
    .map((r) => {
      const a = agg.get(r.playerId);
      const weighted = Math.round(a?.weighted ?? 0);
      return {
        ...r,
        points: officialHasPoints ? r.points : weighted,
        rawPoints: a?.rawPoints ?? 0,
        matchesWon: a?.matchesWon ?? 0,
        matchesPlayed: a?.matchesPlayed ?? 0,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.matchesWon - a.matchesWon ||
        playerName(a).localeCompare(playerName(b), "sr")
    );
}

// ——— Klubovi / lige / grupe ———
export function getClubs(): Club[] {
  return read<Club[]>("clubs");
}

export function getClub(id: number): Club | undefined {
  return getClubs().find((c) => c.id === id);
}

export function getLeagues(): League[] {
  return read<League[]>("leagues");
}

export function getLeaguesForClub(clubId: number): League[] {
  return getLeagues().filter((l) => l.clubId === clubId);
}

export function getLeague(clubId: number, leagueId: number): League | undefined {
  return getLeagues().find((l) => l.clubId === clubId && l.id === leagueId);
}

export function getGroups(clubId: number, leagueId: number): Group[] {
  return read<Group[]>("groups").filter(
    (g) => g.clubId === clubId && g.leagueId === leagueId
  );
}

export function getStandings(clubId: number, leagueId: number): Standing[] {
  return read<Standing[]>("standings").filter(
    (s) => s.clubId === clubId && s.leagueId === leagueId
  );
}

export function getStandingsForPlayer(playerId: number): Standing[] {
  return read<Standing[]>("standings").filter(
    (s) => s.player1Id === playerId || s.player2Id === playerId
  );
}

export function getRankForPlayer(playerId: number): { rank: number; points: number } | null {
  const ranking = getRanking();
  const idx = ranking.findIndex((r) => r.playerId === playerId);
  if (idx === -1) return null;
  return { rank: idx + 1, points: ranking[idx].points };
}

export function getStandingsForGroup(groupId: number): Standing[] {
  return read<Standing[]>("standings")
    .filter((s) => s.groupId === groupId)
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.matchesWon - a.matchesWon ||
        b.setsDiff - a.setsDiff ||
        b.gamesDiff - a.gamesDiff
    );
}

export function getRounds(clubId: number, leagueId: number): Round[] {
  return read<Round[]>("rounds")
    .filter((r) => r.clubId === clubId && r.leagueId === leagueId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ——— Agregati za naslovnu ———
export function getStats() {
  const meta = read<ImportMeta>("meta");
  const clubs = getClubs();
  return {
    players: meta.counts.players ?? getPlayers().length,
    teams: meta.counts.teams ?? getTeams().length,
    leagues: meta.counts.leagues ?? getLeagues().length,
    clubs: clubs.length,
    importedAt: meta.importedAt,
  };
}
