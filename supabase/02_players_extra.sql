-- Migracija: dodatna polja igrača (kontakt, pol, slika).
-- Pokreni u Supabase → SQL Editor → Run. Idempotentno.

alter table players add column if not exists email     text;
alter table players add column if not exists phone     text;
alter table players add column if not exists gender    text;   -- 'm' | 'f' | '' (opciono)
alter table players add column if not exists photo_url text;

-- Storage bucket za slike igrača (javno čitljiv; upload ide server-side preko service_role)
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

drop policy if exists "public_read_player_photos" on storage.objects;
create policy "public_read_player_photos"
  on storage.objects for select
  using (bucket_id = 'player-photos');

-- Kontakt podaci: samo service_role (admin), ne anon/authenticated
revoke select (email, phone) on public.players from anon, authenticated;
grant select (email, phone) on public.players to service_role;
