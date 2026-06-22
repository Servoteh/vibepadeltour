-- Faza 2: unos rezultata.
-- Tabela odigranih mečeva + RPC funkcije koje ATOMIČNO upišu meč i inkrementuju
-- standings agregat za obe ekipe. Pokreni jednom u Supabase → SQL Editor → Run.
-- Idempotentno je (može da se pokrene više puta).

-- ——— Tabela mečeva ———
create table if not exists matches (
  id             bigint generated always as identity primary key,
  group_id       integer not null references groups(id) on delete cascade,
  club_id        integer not null,
  league_id      integer not null,
  round_id       integer references rounds(id) on delete set null,
  team1_id       integer not null,
  team2_id       integer not null,
  sets           jsonb   not null default '[]'::jsonb,   -- [[6,4],[3,6],[6,2]]
  winner_team_id integer not null,
  walkover       boolean not null default false,          -- predaja / nepojavljivanje
  played_on      date,
  note           text    not null default '',
  created_at     timestamptz not null default now()
);

create index if not exists idx_matches_group  on matches(group_id);
create index if not exists idx_matches_league on matches(club_id, league_id);

-- RLS uključen, bez select policy → matches se čita isključivo preko service_role
-- (admin, server-side). Javnost ne vidi sirove mečeve, samo agregat u standings.
alter table matches enable row level security;

-- ——— record_match: upiše meč i ažurira standings ———
-- Bodovanje: pobeda = 2, poraz = 1 (motiviše dolazak i odigravanje).
-- Predaja/nepojavljivanje (walkover): pobednik 2, predao 0; gem/set količnik se NE menja
-- (rezultat se beleži kao 6:0 6:0 samo za prikaz).
create or replace function record_match(
  p_group_id  integer,
  p_team1     integer,
  p_team2     integer,
  p_sets      jsonb,
  p_walkover  boolean,
  p_winner    integer,
  p_round_id  integer,
  p_played_on date,
  p_note      text
) returns bigint
language plpgsql
as $$
declare
  v_match_id bigint;
  v_club     integer;
  v_league   integer;
  v_set      jsonb;
  g1 integer := 0;   -- gemovi tim1
  g2 integer := 0;   -- gemovi tim2
  s1 integer := 0;   -- setovi tim1
  s2 integer := 0;   -- setovi tim2
  v_winner integer;
  v_loser  integer;
begin
  if p_team1 = p_team2 then
    raise exception 'Tim ne može da igra protiv sebe.';
  end if;

  select club_id, league_id into v_club, v_league from groups where id = p_group_id;
  if v_club is null then
    raise exception 'Grupa % ne postoji.', p_group_id;
  end if;

  if p_walkover then
    if p_winner is null or p_winner not in (p_team1, p_team2) then
      raise exception 'Za predaju izaberi pobednika (jednu od dve ekipe).';
    end if;
    v_winner := p_winner;
  else
    for v_set in select * from jsonb_array_elements(coalesce(p_sets, '[]'::jsonb)) loop
      g1 := g1 + (v_set->>0)::int;
      g2 := g2 + (v_set->>1)::int;
      if    (v_set->>0)::int > (v_set->>1)::int then s1 := s1 + 1;
      elsif (v_set->>1)::int > (v_set->>0)::int then s2 := s2 + 1;
      end if;
    end loop;
    if s1 = s2 then
      raise exception 'Rezultat nema jasnog pobednika (setovi %:%).', s1, s2;
    end if;
    v_winner := case when s1 > s2 then p_team1 else p_team2 end;
  end if;

  v_loser := case when v_winner = p_team1 then p_team2 else p_team1 end;

  insert into matches(group_id, club_id, league_id, round_id, team1_id, team2_id,
                      sets, winner_team_id, walkover, played_on, note)
  values (p_group_id, v_club, v_league, p_round_id, p_team1, p_team2,
          case when p_walkover then '[[6,0],[6,0]]'::jsonb else coalesce(p_sets, '[]'::jsonb) end,
          v_winner, p_walkover, p_played_on, coalesce(p_note, ''))
  returning id into v_match_id;

  -- odigrano +1 za obe ekipe
  update standings set matches_played = matches_played + 1
    where group_id = p_group_id and team_id in (p_team1, p_team2);

  -- pobednik: pobeda +1, bodovi +2
  update standings set matches_won = matches_won + 1, points = points + 2
    where group_id = p_group_id and team_id = v_winner;

  -- gubitnik: bodovi +1 (odigrao) ili +0 (predao)
  update standings set points = points + (case when p_walkover then 0 else 1 end)
    where group_id = p_group_id and team_id = v_loser;

  -- gem/set količnik samo za stvarno odigrane mečeve
  if not p_walkover then
    update standings set games_diff = games_diff + (g1 - g2),
                         sets_diff  = sets_diff  + (s1 - s2)
      where group_id = p_group_id and team_id = p_team1;
    update standings set games_diff = games_diff + (g2 - g1),
                         sets_diff  = sets_diff  + (s2 - s1)
      where group_id = p_group_id and team_id = p_team2;
  end if;

  return v_match_id;
end $$;

-- ——— delete_match: poništi meč i vrati standings na prethodno stanje ———
create or replace function delete_match(p_match_id bigint)
returns void
language plpgsql
as $$
declare
  m       matches%rowtype;
  v_set   jsonb;
  g1 integer := 0; g2 integer := 0; s1 integer := 0; s2 integer := 0;
  v_loser integer;
begin
  select * into m from matches where id = p_match_id;
  if not found then return; end if;

  v_loser := case when m.winner_team_id = m.team1_id then m.team2_id else m.team1_id end;

  update standings set matches_played = matches_played - 1
    where group_id = m.group_id and team_id in (m.team1_id, m.team2_id);
  update standings set matches_won = matches_won - 1, points = points - 2
    where group_id = m.group_id and team_id = m.winner_team_id;
  update standings set points = points - (case when m.walkover then 0 else 1 end)
    where group_id = m.group_id and team_id = v_loser;

  if not m.walkover then
    for v_set in select * from jsonb_array_elements(coalesce(m.sets, '[]'::jsonb)) loop
      g1 := g1 + (v_set->>0)::int;
      g2 := g2 + (v_set->>1)::int;
      if    (v_set->>0)::int > (v_set->>1)::int then s1 := s1 + 1;
      elsif (v_set->>1)::int > (v_set->>0)::int then s2 := s2 + 1;
      end if;
    end loop;
    update standings set games_diff = games_diff - (g1 - g2),
                         sets_diff  = sets_diff  - (s1 - s2)
      where group_id = m.group_id and team_id = m.team1_id;
    update standings set games_diff = games_diff - (g2 - g1),
                         sets_diff  = sets_diff  - (s2 - s1)
      where group_id = m.group_id and team_id = m.team2_id;
  end if;

  delete from matches where id = p_match_id;
end $$;
