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
};

function blocked(unavail: Map<number, Set<number>> | undefined, teamId: number, hour: number): boolean {
  const s = unavail?.get(teamId);
  if (!s) return false;
  return s.has(-1) || s.has(hour);
}

// Dodeljuje mečeve u mrežu (teren, sat).
//  Faza 1: ekipe sa 2 meča (prijavile dupli termin) → uzastopni satovi.
//  Faza 2: ostali mečevi, najjači prvi, sa prioritetom terena 2.
export function assignSlots(matches: SchedMatch[], opts: AssignOptions = {}): AssignResult {
  const courts = opts.courts ?? DEFAULT_COURTS;
  const hours = opts.hours ?? DEFAULT_HOURS;
  const unavail = opts.unavailable;
  const consecutive = opts.consecutiveTeams ?? new Set<number>();
  const courtOrder = COURT_PRIORITY.filter((c) => courts.includes(c));

  const occupied = new Set<string>(); // "court:hour"
  const teamHour = new Set<string>(); // "teamId:hour"
  const assigned: SlotAssignment[] = [];

  // Nađi slobodan teren za meč u datom satu (prioritet terena 2), uz provere.
  const freeCourt = (m: SchedMatch, hour: number): number | null => {
    if (blocked(unavail, m.team1Id, hour) || blocked(unavail, m.team2Id, hour)) return null;
    if (teamHour.has(`${m.team1Id}:${hour}`) || teamHour.has(`${m.team2Id}:${hour}`)) return null;
    for (const court of courtOrder) if (!occupied.has(`${court}:${hour}`)) return court;
    return null;
  };
  const occupy = (m: SchedMatch, court: number, hour: number) => {
    occupied.add(`${court}:${hour}`);
    teamHour.add(`${m.team1Id}:${hour}`);
    teamHour.add(`${m.team2Id}:${hour}`);
    assigned.push({ ...m, court, hour });
  };

  const handled = new Set<SchedMatch>();

  // ——— Faza 1: dupli termini (uzastopni satovi) ———
  if (consecutive.size > 0) {
    const byTeam = new Map<number, SchedMatch[]>();
    for (const m of matches) {
      for (const t of [m.team1Id, m.team2Id]) {
        if (consecutive.has(t)) (byTeam.get(t) ?? byTeam.set(t, []).get(t)!).push(m);
      }
    }
    for (const [, ms] of byTeam) {
      const pair = [...ms].sort((a, b) => b.strength - a.strength).slice(0, 2);
      if (pair.length < 2 || pair.some((m) => handled.has(m))) continue;
      const [m1, m2] = pair; // m1 jači → ide na teren 2 prioritetno
      let done = false;
      for (let i = 0; i < hours.length - 1 && !done; i++) {
        const h1 = hours[i];
        const h2 = hours[i + 1];
        if (h2 !== h1 + 1) continue; // stvarno uzastopni satovi
        const c1 = freeCourt(m1, h1);
        if (c1 == null) continue;
        occupy(m1, c1, h1);
        const c2 = freeCourt(m2, h2);
        if (c2 == null) {
          // poništi m1 i probaj dalje
          occupied.delete(`${c1}:${h1}`);
          teamHour.delete(`${m1.team1Id}:${h1}`);
          teamHour.delete(`${m1.team2Id}:${h1}`);
          assigned.pop();
          continue;
        }
        occupy(m2, c2, h2);
        handled.add(m1);
        handled.add(m2);
        done = true;
      }
    }
  }

  // ——— Faza 2: ostali mečevi (najjači prvi, teren 2) ———
  const unassigned: SchedMatch[] = [];
  const rest = matches.filter((m) => !handled.has(m)).sort((a, b) => b.strength - a.strength);
  for (const m of rest) {
    let placed = false;
    for (const hour of hours) {
      const court = freeCourt(m, hour);
      if (court != null) {
        occupy(m, court, hour);
        placed = true;
        break;
      }
    }
    if (!placed) unassigned.push(m);
  }

  return { assigned, unassigned };
}
