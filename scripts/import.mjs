// Jednokratni uvoz podataka sa postojećeg Vibe Padel Tour API-ja u data/*.json
// Pokretanje: node scripts/import.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "https://vibepadeltour.com/api/v1";
const UA = { "User-Agent": "Mozilla/5.0 (VPT import)", Accept: "application/json" };
const OUT = path.join(process.cwd(), "data");

async function get(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${url}`);
  return res.json();
}

// Povuci sve stranice paginiranog endpointa koji vraća { [key]: [], total, page, pageSize }
async function getAll(endpoint, key) {
  const size = 500;
  let page = 1;
  let out = [];
  while (true) {
    const data = await get(`${BASE}/${endpoint}?page=${page}&pageSize=${size}`);
    const items = data[key] ?? [];
    out = out.concat(items);
    const total = data.total ?? items.length;
    if (out.length >= total || items.length === 0) break;
    page += 1;
  }
  return out;
}

async function save(name, data) {
  await writeFile(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 2), "utf8");
  console.log(`  ✓ data/${name}.json (${Array.isArray(data) ? data.length : Object.keys(data).length})`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log("• Igrači, timovi, ranking...");
  const players = await getAll("players", "players");
  const teams = await getAll("teams", "teams");
  const ranking = await getAll("ranking", "entries");
  await save("players", players);
  await save("teams", teams);
  await save("ranking", ranking);

  console.log("• Klubovi → lige → grupe → standings + kola...");
  const clubs = await getAll("clubs", "clubs");
  const leaguesOut = [];
  const groupsOut = [];
  const standingsOut = [];
  const roundsOut = [];

  for (const club of clubs) {
    let leagues = [];
    try {
      const ld = await get(`${BASE}/clubs/${club.id}/leagues`);
      leagues = ld.leagues ?? [];
    } catch (e) {
      console.warn(`  ! lige za klub ${club.id}: ${e.message}`);
    }
    for (const league of leagues) {
      leaguesOut.push({ ...league, clubId: club.id });

      // grupe
      let groups = [];
      try {
        const gd = await get(`${BASE}/clubs/${club.id}/leagues/${league.id}/groups`);
        groups = gd.groups ?? [];
      } catch (e) {
        console.warn(`  ! grupe ${club.id}/${league.id}: ${e.message}`);
      }
      for (const group of groups) {
        groupsOut.push({ ...group, clubId: club.id, leagueId: league.id });
        // standings po grupi
        try {
          const sd = await get(
            `${BASE}/clubs/${club.id}/leagues/${league.id}/groups/${group.id}/standings`
          );
          const rows = Array.isArray(sd) ? sd : sd.standings ?? [];
          for (const row of rows) {
            standingsOut.push({ ...row, clubId: club.id, leagueId: league.id });
          }
        } catch (e) {
          console.warn(`  ! standings ${group.id}: ${e.message}`);
        }
      }

      // kola
      try {
        const rd = await get(`${BASE}/clubs/${club.id}/leagues/${league.id}/rounds`);
        const rounds = rd.rounds ?? [];
        for (const round of rounds) {
          roundsOut.push({ ...round, clubId: club.id, leagueId: league.id });
        }
      } catch (e) {
        console.warn(`  ! kola ${club.id}/${league.id}: ${e.message}`);
      }
    }
  }

  await save("clubs", clubs);
  await save("leagues", leaguesOut);
  await save("groups", groupsOut);
  await save("standings", standingsOut);
  await save("rounds", roundsOut);

  await save("meta", {
    importedAt: new Date().toISOString(),
    counts: {
      players: players.length,
      teams: teams.length,
      ranking: ranking.length,
      clubs: clubs.length,
      leagues: leaguesOut.length,
      groups: groupsOut.length,
      standings: standingsOut.length,
      rounds: roundsOut.length,
    },
  });

  console.log("\nGotovo.");
}

main().catch((e) => {
  console.error("Greška pri uvozu:", e);
  process.exit(1);
});
