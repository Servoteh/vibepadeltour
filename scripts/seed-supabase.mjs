// Seed Supabase baze iz data/*.json (jednokratni uvoz postojećih podataka).
// Pokretanje: node --env-file=.env.local scripts/seed-supabase.mjs
// Zahteva: NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY u .env.local
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Nedostaju NEXT_PUBLIC_SUPABASE_URL ili SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });
const DATA = path.join(process.cwd(), "data");

async function load(name) {
  return JSON.parse(await readFile(path.join(DATA, `${name}.json`), "utf8"));
}

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const dob = (d) => (!d || d.startsWith("0001") ? null : d);

async function upsert(table, rows, onConflict) {
  const SIZE = 500;
  for (let i = 0; i < rows.length; i += SIZE) {
    const chunk = rows.slice(i, i + SIZE);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`  ✓ ${table}: ${rows.length}`);
}

async function main() {
  const [players, teams, clubs, leagues, groups, standings, rounds] = await Promise.all([
    load("players"), load("teams"), load("clubs"), load("leagues"),
    load("groups"), load("standings"), load("rounds"),
  ]);

  console.log("Seed → Supabase…");

  await upsert("clubs", clubs.map((c) => ({
    id: c.id, name: clean(c.name), description: c.description ?? "", rules: c.rules ?? "",
  })), "id");

  await upsert("players", players.map((p) => ({
    id: p.id, first_name: clean(p.firstName), last_name: clean(p.lastName), dob: dob(p.dob),
  })), "id");

  await upsert("leagues", leagues.map((l) => ({
    id: l.id, club_id: l.clubId, name: clean(l.name),
    description: l.description ?? "", rules: l.rules ?? "", status: l.status ?? "",
  })), "id");

  await upsert("groups", groups.map((g) => ({
    id: g.id, club_id: g.clubId, league_id: g.leagueId, name: clean(g.name),
  })), "id");

  await upsert("teams", teams.map((t) => ({
    id: t.id, player1_id: t.player1Id, player2_id: t.player2Id, name: clean(t.name),
  })), "id");

  await upsert("standings", standings.map((s) => ({
    group_id: s.groupId, team_id: s.teamId, club_id: s.clubId, league_id: s.leagueId,
    team_name: clean(s.teamName), player1_id: s.player1Id, player1_name: clean(s.player1Name),
    player2_id: s.player2Id, player2_name: clean(s.player2Name),
    matches_played: s.matchesPlayed, matches_won: s.matchesWon,
    games_diff: s.gamesDiff, sets_diff: s.setsDiff, points: s.points,
  })), "group_id,team_id");

  await upsert("rounds", rounds.map((r) => ({
    id: r.id, club_id: r.clubId, league_id: r.leagueId, name: clean(r.name),
    date: r.date && !r.date.startsWith("0001") ? r.date : null,
    start_hour: r.start_hour ?? 17, end_hour: r.end_hour ?? 23,
    status: r.status ?? "", courts: r.courts ?? [],
  })), "id");

  console.log("Gotovo.");
}

main().catch((e) => {
  console.error("Greška:", e.message);
  process.exit(1);
});
