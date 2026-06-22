-- Vibe Padel Tour — šema baze (Supabase / Postgres)
-- Pokreni jednom u Supabase: Dashboard → SQL Editor → New query → nalepi → Run.
-- Idempotentno je (može da se pokrene više puta).

-- ——— Tabele ———

create table if not exists clubs (
  id          integer primary key,
  name        text not null,
  description text default '',
  rules       text default ''
);

create table if not exists players (
  id         integer primary key,
  first_name text not null default '',
  last_name  text not null default '',
  dob        date
);

create table if not exists leagues (
  id          integer primary key,
  club_id     integer not null references clubs(id) on delete cascade,
  name        text not null,
  description text default '',
  rules       text default '',
  status      text default ''
);

create table if not exists groups (
  id        integer primary key,
  club_id   integer not null references clubs(id) on delete cascade,
  league_id integer not null references leagues(id) on delete cascade,
  name      text not null
);

create table if not exists teams (
  id         integer primary key,
  player1_id integer references players(id) on delete set null,
  player2_id integer references players(id) on delete set null,
  name       text not null default ''
);

create table if not exists standings (
  group_id       integer not null references groups(id) on delete cascade,
  team_id        integer not null,
  club_id        integer not null,
  league_id      integer not null,
  team_name      text default '',
  player1_id     integer,
  player1_name   text default '',
  player2_id     integer,
  player2_name   text default '',
  matches_played integer not null default 0,
  matches_won    integer not null default 0,
  games_diff     integer not null default 0,
  sets_diff      integer not null default 0,
  points         integer not null default 0,
  primary key (group_id, team_id)
);

create table if not exists rounds (
  id         integer primary key,
  club_id    integer not null,
  league_id  integer not null references leagues(id) on delete cascade,
  name       text not null,
  date       date,
  start_hour integer default 17,
  end_hour   integer default 23,
  status     text default '',
  courts     jsonb default '[]'::jsonb
);

-- Korisni indeksi
create index if not exists idx_leagues_club on leagues(club_id);
create index if not exists idx_groups_league on groups(club_id, league_id);
create index if not exists idx_standings_league on standings(club_id, league_id);
create index if not exists idx_standings_group on standings(group_id);
create index if not exists idx_rounds_league on rounds(club_id, league_id);
create index if not exists idx_teams_p1 on teams(player1_id);
create index if not exists idx_teams_p2 on teams(player2_id);

-- ——— RLS: javno ČITANJE, upis samo preko servera (service_role zaobilazi RLS) ———

alter table clubs     enable row level security;
alter table players   enable row level security;
alter table leagues   enable row level security;
alter table groups    enable row level security;
alter table teams     enable row level security;
alter table standings enable row level security;
alter table rounds    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['clubs','players','leagues','groups','teams','standings','rounds']
  loop
    execute format('drop policy if exists "public_read_%1$s" on %1$s;', t);
    execute format('create policy "public_read_%1$s" on %1$s for select using (true);', t);
  end loop;
end $$;
