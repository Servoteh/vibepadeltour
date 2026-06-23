-- Faza 3: raspored mečeva (kombinatorika + predlog kola).
-- Pokreni jednom u Supabase → SQL Editor → Run. Idempotentno.

-- ——— Kapiteni (magic-link nalozi; email se šalje kasnije, za sad admin deli link) ———
create table if not exists captains (
  id         bigint generated always as identity primary key,
  team_id    integer not null references teams(id) on delete cascade,
  club_id    integer not null,
  league_id  integer not null,
  email      text not null default '',
  name       text not null default '',
  token      text not null unique,                 -- tajni token za /kapiten/<token>
  created_at timestamptz not null default now(),
  unique (team_id, league_id)
);
create index if not exists idx_captains_league on captains(club_id, league_id);

-- ——— Nedostupnost tima u kolu (max 3 od 10 kola — limit se proverava u aplikaciji) ———
-- hour = NULL znači ceo dan; inače konkretan sat koji NE odgovara.
create table if not exists team_unavailability (
  id         bigint generated always as identity primary key,
  group_id   integer not null references groups(id) on delete cascade,
  team_id    integer not null,
  round_id   integer not null references rounds(id) on delete cascade,
  hour       integer,                               -- 17..22 ili NULL (ceo termin)
  source     text not null default 'admin',         -- 'admin' | 'captain'
  created_at timestamptz not null default now()
);
create index if not exists idx_unavail_round on team_unavailability(round_id);
create index if not exists idx_unavail_team  on team_unavailability(team_id, group_id);

-- ——— Otkazivanja meča (max 5 kola, najkasnije 3 dana unapred — provera u aplikaciji) ———
create table if not exists match_cancellations (
  id         bigint generated always as identity primary key,
  group_id   integer not null references groups(id) on delete cascade,
  team_id    integer not null,
  round_id   integer not null references rounds(id) on delete cascade,
  source     text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (team_id, round_id)
);
create index if not exists idx_cancel_round on match_cancellations(round_id);

-- ——— Dupli termin: ekipa prijavi da igra 2 meča u kolu → uzastopni satovi ———
create table if not exists team_double_requests (
  id         bigint generated always as identity primary key,
  group_id   integer not null references groups(id) on delete cascade,
  team_id    integer not null,
  round_id   integer not null references rounds(id) on delete cascade,
  source     text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (team_id, round_id)
);
create index if not exists idx_double_round on team_double_requests(round_id);

-- ——— Raspored / predlog (fixtures): meč dodeljen kolu, terenu i satu ———
create table if not exists fixtures (
  id         bigint generated always as identity primary key,
  group_id   integer not null references groups(id) on delete cascade,
  club_id    integer not null,
  league_id  integer not null,
  round_id   integer not null references rounds(id) on delete cascade,
  team1_id   integer not null,
  team2_id   integer not null,
  court      integer not null,                      -- 1..6
  hour       integer not null,                      -- 17..22
  strength   numeric not null default 0,            -- jačina meča (za teren-2 pravilo)
  status     text not null default 'proposed',      -- 'proposed' | 'accepted'
  created_at timestamptz not null default now(),
  unique (round_id, court, hour),                   -- jedan meč po terenu/satu
  unique (group_id, round_id, team1_id, team2_id)
);
create index if not exists idx_fixtures_round  on fixtures(round_id);
create index if not exists idx_fixtures_league on fixtures(club_id, league_id, status);

-- ——— RLS ———
alter table captains              enable row level security;
alter table team_unavailability   enable row level security;
alter table match_cancellations   enable row level security;
alter table team_double_requests  enable row level security;
alter table fixtures              enable row level security;

-- Javno se vidi SAMO prihvaćen raspored; predlozi i lični podaci kapitena su skriveni.
drop policy if exists "public_read_fixtures_accepted" on fixtures;
create policy "public_read_fixtures_accepted"
  on fixtures for select using (status = 'accepted');
-- captains / team_unavailability / match_cancellations: bez select policy →
-- čitaju se samo preko service_role (admin i kapiten-server pristup preko tokena).
