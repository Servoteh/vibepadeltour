-- Faza 3 / dopuna: željeni termin (kad ekipa MOŽE da igra) + oznaka vanrednog kola.
-- Pokreni jednom u Supabase → SQL Editor → Run. Idempotentno.

-- Vanredno kolo (van redovnog rasporeda).
alter table rounds add column if not exists extra boolean not null default false;

-- Željeni sat ekipe za kolo (pozitivna preferencija; scheduler je poštuje ako može).
create table if not exists team_preference (
  id         bigint generated always as identity primary key,
  group_id   integer not null references groups(id) on delete cascade,
  team_id    integer not null,
  round_id   integer not null references rounds(id) on delete cascade,
  hour       integer not null,                       -- 17..22 (kad MOŽE da igra)
  source     text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (team_id, round_id)
);
create index if not exists idx_pref_round on team_preference(round_id);

alter table team_preference enable row level security;
-- bez select policy → čita se samo preko service_role (admin/kapiten-server).
