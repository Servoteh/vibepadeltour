// Raspoređivanje mečeva (čista logika, bez baze).
//  1) circlePairings — round-robin (circle metoda): koje ekipe igraju u kom kolu.
//  2) assignSlots — dodela parova u mrežu 6 terena × satni slotovi (17–23h),
//     uz pravilo: najjači mečevi (po rangu) idu na TEREN 2; poštuje nedostupnost.

export const DEFAULT_COURTS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_HOURS = [17, 18, 19, 20, 21, 22];
// Prioritet terena pri dodeli: teren 2 prvi (tu idu najjači mečevi).
export const COURT_PRIORITY = [2, 1, 3, 4, 5, 6];

export type Pairing = { aId: number; bId: number };

// Round-robin po circle metodi. teamIds proizvoljnog redosleda; roundIndex je 0-based.
// Za neparan broj ekipa dodaje se BYE (jedna ekipa pauzira) — taj par se izostavlja.
export function circlePairings(teamIds: number[], roundIndex: number): Pairing[] {
  const ids = [...teamIds];
  if (ids.length < 2) return [];
  const BYE = -1;
  if (ids.length % 2 === 1) ids.push(BYE);
  const n = ids.length;
  const rounds = n - 1;
  const idx = ((roundIndex % rounds) + rounds) % rounds;

  // Rotacija: prvi fiksiran, ostali se okreću.
  const fixed = ids[0];
  const rot = ids.slice(1);
  for (let r = 0; r < idx; r++) rot.unshift(rot.pop() as number);

  const arr = [fixed, ...rot];
  const pairs: Pairing[] = [];
  for (let i = 0; i < n / 2; i++) {
    const a = arr[i];
    const b = arr[n - 1 - i];
    if (a === BYE || b === BYE) continue;
    pairs.push({ aId: a, bId: b });
  }
  return pairs;
}

// Ukupan broj kola u round-robin-u (svako sa svakim jednom).
export function totalRounds(teamCount: number): number {
  if (teamCount < 2) return 0;
  return teamCount % 2 === 0 ? teamCount - 1 : teamCount;
}

export type SchedMatch = {
  groupId: number;
  team1Id: number;
  team2Id: number;
  strength: number; // veće = jači meč
};

export type SlotAssignment = SchedMatch & { court: number; hour: number };

export type AssignResult = {
  assigned: SlotAssignment[];
  unassigned: SchedMatch[]; // nije stalo u mrežu ili blokirano nedostupnošću
};

export type AssignOptions = {
  courts?: number[];
  hours?: number[];
  // teamId -> satovi kada NE može; ako sadrži -1, ceo termin je blokiran.
  unavailable?: Map<number, Set<number>>;
  // Ekipe koje igraju 2 meča u kolu → njihova dva meča idu u UZASTOPNE satove.
  consecutiveTeams?: Set<number>;
  // teamId -> željeni sat (kad MOŽE); scheduler ga probava prvog ako je slobodan.
  preferredHours?: Map<number, number>;
};

function blocked(unavail: Map<number, Set<number>> | undefined, teamId: number, hour: number): boolean {
  const s = unavail?.get(teamId);
  if (!s) return false;
  return s.has(-1) || s.has(hour);
}

// Dodeljuje mečeve u mrežu (teren, sat). Svaki meč traje tačno 1 sat (jedan slot).
//  Balans „paralelno po satu": mečevi se prvo šire po terenima u istom satu
//  (popunjava se najraniji sat sa slobodnim terenom), pa tek onda sledeći sat.
//  U svakom satu NAJJAČI meč ide na teren 2.
//  Dupli termini (consecutiveTeams) → dva meča ekipe u uzastopnim satovima.
//  Poštuje nedostupnost i željeni sat (preferredHours).
export function assignSlots(matches: SchedMatch[], opts: AssignOptions = {}): AssignResult {
  const courts = opts.courts ?? DEFAULT_COURTS;
  const hours = opts.hours ?? DEFAULT_HOURS;
  const unavail = opts.unavailable;
  const consecutive = opts.consecutiveTeams ?? new Set<number>();
  const preferred = opts.preferredHours;
  const cap = courts.length; // mečeva po satu (jedan po terenu)

  const hourMatches = new Map<number, SchedMatch[]>();
  const hourTeams = new Map<number, Set<number>>();
  for (const h of hours) {
    hourMatches.set(h, []);
    hourTeams.set(h, new Set<number>());
  }

  const canPlace = (m: SchedMatch, h: number): boolean => {
    if (blocked(unavail, m.team1Id, h) || blocked(unavail, m.team2Id, h)) return false;
    const ts = hourTeams.get(h)!;
    if (ts.has(m.team1Id) || ts.has(m.team2Id)) return false;
    return hourMatches.get(h)!.length < cap;
  };
  const place = (m: SchedMatch, h: number) => {
    hourMatches.get(h)!.push(m);
    const ts = hourTeams.get(h)!;
    ts.add(m.team1Id);
    ts.add(m.team2Id);
  };

  const sorted = [...matches].sort((a, b) => b.strength - a.strength);
  const handled = new Set<SchedMatch>();
  const unassigned: SchedMatch[] = [];

  // ——— Faza 1: dupli termini → uzastopni satovi ———
  if (consecutive.size > 0) {
    const byTeam = new Map<number, SchedMatch[]>();
    for (const m of sorted) {
      for (const t of [m.team1Id, m.team2Id]) {
        if (consecutive.has(t)) (byTeam.get(t) ?? byTeam.set(t, []).get(t)!).push(m);
      }
    }
    for (const [, ms] of byTeam) {
      const pair = ms.filter((m) => !handled.has(m)).slice(0, 2);
      if (pair.length < 2) continue;
      const [m1, m2] = pair;
      for (let i = 0; i < hours.length - 1; i++) {
        const h1 = hours[i];
        const h2 = hours[i + 1];
        if (h2 !== h1 + 1) continue;
        if (canPlace(m1, h1) && canPlace(m2, h2)) {
          place(m1, h1);
          place(m2, h2);
          handled.add(m1);
          handled.add(m2);
          break;
        }
      }
    }
  }

  // ——— Faza 2: dodela sata (najraniji slobodan; željeni sat prvi) ———
  for (const m of sorted) {
    if (handled.has(m)) continue;
    const pref = preferred?.get(m.team1Id) ?? preferred?.get(m.team2Id);
    const order = pref != null ? [pref, ...hours.filter((h) => h !== pref)] : hours;
    let placed = false;
    for (const h of order) {
      if (canPlace(m, h)) {
        place(m, h);
        placed = true;
        break;
      }
    }
    if (!placed) unassigned.push(m);
  }

  // ——— Faza B: dodela terena unutar sata (najjači → teren 2) ———
  const courtOrder = COURT_PRIORITY.filter((c) => courts.includes(c));
  const assigned: SlotAssignment[] = [];
  for (const h of hours) {
    const ms = hourMatches.get(h)!.slice().sort((a, b) => b.strength - a.strength);
    ms.forEach((m, idx) => {
      assigned.push({ ...m, court: courtOrder[idx] ?? courts[idx] ?? idx + 1, hour: h });
    });
  }

  return { assigned, unassigned };
}
