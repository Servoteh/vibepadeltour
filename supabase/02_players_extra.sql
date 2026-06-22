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
