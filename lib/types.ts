// Domenski tipovi za Vibe Padel Tour

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender?: string; // 'm' | 'f' | ''
  photoUrl?: string;
  // Lični kontakt — samo za admina, ne prikazuje se javno
  email?: string;
  phone?: string;
}

export interface Team {
  id: number;
  player1Id: number;
  player2Id: number;
  name: string;
}

export interface RankingEntry {
  playerId: number;
  firstName: string;
  lastName: string;
  points: number;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  rules: string;
}

export interface League {
  id: number;
  name: string;
  description: string;
  rules: string;
  status?: string;
  clubId: number;
}

export interface Group {
  id: number;
  name: string;
  clubId: number;
  leagueId: number;
}

export interface Standing {
  groupId: number;
  teamId: number;
  teamName: string;
  player1Id: number;
  player1Name: string;
  player2Id: number;
  player2Name: string;
  matchesPlayed: number;
  matchesWon: number;
  gamesDiff: number;
  setsDiff: number;
  points: number;
  clubId: number;
  leagueId: number;
}

export interface Court {
  id: number;
  name: string;
}

export interface Round {
  id: number;
  name: string;
  date: string;
  start_hour: number;
  end_hour: number;
  courts: Court[];
  status: string;
  clubId: number;
  leagueId: number;
}

export interface ImportMeta {
  importedAt: string;
  counts: Record<string, number>;
}
