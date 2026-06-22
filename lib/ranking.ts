// Metodologija bodovanja rang liste Vibe Padel Tour-a.
//
// Princip (po zahtevu): jačina PROTIVNIKA je najvažnija. Divizije svih liga čine
// JEDINSTVENU LESTVICU (kao promocija/ispadanje — Liga1 C ispada u Liga2 GOLD), a
// bodovi se množe STRMO opadajućim koeficijentom niz lestvicu. Tako A-GOLD u Ligi 1
// stoji u sasvim posebnoj kategoriji iznad SILVER-a, B, C i nižih liga — i igrač koji
// skuplja bodove u više slabijih divizija ne može da pretekne GOLD igrače.
//
// Bodovi igrača = Σ ( grupni bodovi × DECAY^(nivo-1) × SCALE )
//
// Sve je ovde i lako se podešava: smanji DECAY za još veći jaz između divizija.

/** Strmina opadanja niz lestvicu (manje = veći jaz između divizija). */
export const DECAY = 0.55;
/** Skala za čitljive brojeve (kozmetika, ne menja poredak). */
export const SCALE = 25;

/**
 * Jedinstvena lestvica jačine: nivo 1 = najjača divizija (Liga 1 A-GOLD).
 * Ključ je `${rangLige}-${divizija}`. Manji nivo = jača konkurencija.
 */
export const LADDER_LEVEL: Record<string, number> = {
  // Liga 1 — Premier
  "1-gold": 1,
  "1-silver": 2,
  "1-a": 2,
  "1-b": 3,
  "1-c": 4,
  "1-d": 5,
  // Liga 2
  "2-gold": 5,
  "2-silver": 6,
  "2-a": 6,
  "2-b": 7,
  "2-c": 8,
  "2-d": 9,
  // Liga 3
  "3-gold": 9,
  "3-a": 9,
  "3-silver": 10,
  "3-b": 10,
  "3-c": 11,
  "3-d": 12,
};

/** Rang lige (1/2/3) izvučen iz imena, npr. "BPK Liga 2- (sezona 1/2026)" → 2. */
export function leagueTier(leagueName: string): number | null {
  const m = leagueName.match(/Liga\s*([123])/i);
  return m ? Number(m[1]) : null;
}

/** Ključ divizije iz imena grupe, npr. "A - (*GOLD*)" → "gold", "C" → "c". */
export function divisionKey(groupName: string): string {
  const g = groupName.toUpperCase();
  if (g.includes("GOLD")) return "gold";
  if (g.includes("SILVER")) return "silver";
  if (g.includes("PLAY-IN") || g.includes("PLAY IN")) return "playin";
  if (g.includes("PLAY-OUT") || g.includes("PLAY OUT")) return "playout";
  if (g.includes("ISTOK") || g.includes("ZAPAD")) return "other";
  const t = g.replace(/[^A-ZŠĐČĆŽ]/g, "").trim();
  if (t === "A") return "a";
  if (t === "B") return "b";
  if (t === "C") return "c";
  if (t === "D") return "d";
  return "other";
}

/** Nivo na jedinstvenoj lestvici za dati plasman (manji = jači). */
export function ladderLevel(leagueName: string, groupName: string): number {
  const tier = leagueTier(leagueName) ?? 2;
  const div = divisionKey(groupName);
  const explicit = LADDER_LEVEL[`${tier}-${div}`];
  if (explicit != null) return explicit;
  // Fallback: sredina ranga lige za nepoznate/posebne grupe (play-in/out, istok/zapad)
  const base = (tier - 1) * 4; // L1→0, L2→4, L3→8
  const offset = div === "playin" ? 1.5 : div === "playout" ? 2.5 : 2;
  return base + offset + 1;
}

/** Koeficijent kojim se množe grupni bodovi za jedan plasman. */
export function rowWeight(leagueName: string, groupName: string): number {
  return Math.pow(DECAY, ladderLevel(leagueName, groupName) - 1) * SCALE;
}

/** Čitljiva oznaka ranga lige za prikaz (npr. "Liga 1"). */
export function tierLabel(leagueName: string): string {
  const t = leagueTier(leagueName);
  return t != null ? `Liga ${t}` : leagueName;
}
