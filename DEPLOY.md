# Deploy — Cloudflare Workers (SSR / OpenNext)

Od **Faze 2** sajt je server-renderovan (čita iz Supabase-a na svaki zahtev, ima admin
panel i unos rezultata), pa se deployuje preko **OpenNext Cloudflare adaptera**, a NE više
kao static export.

Deploy ide iz GitHub repo-a preko **Workers Builds** — svaki `git push` na `main` pokreće
build i deploy.

## Podešavanja Worker build-a (Cloudflare dashboard)

- **Build command:** `npx opennextjs-cloudflare build`
- **Deploy command:** `npx wrangler deploy`
- **Root directory:** `/`
- (preporučeno) Environment var `NODE_VERSION` = `22`

> `wrangler.jsonc` ima `main: .open-next/worker.js` i `assets.directory: .open-next/assets`,
> uz `nodejs_compat`. Konfiguracija adaptera je u [`open-next.config.ts`](./open-next.config.ts).

## Tajne i env (KRITIČNO)

Javne vrednosti su u `wrangler.jsonc` → `vars` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
Tajne se NE drže u repo-u — dodaju se kao Worker secrets:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY   # service_role ključ (admin upisi)
npx wrangler secret put ADMIN_PASSWORD              # lozinka za /admin login
npx wrangler secret put SESSION_SECRET              # tajni ključ za potpis session cookie-ja
```

`SESSION_SECRET` generiši nasumično, npr: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## Migracije baze (pokreni ručno u Supabase → SQL Editor)

Redom, idempotentno:

1. [`supabase/schema.sql`](./supabase/schema.sql) — tabele + RLS (javno čitanje)
2. [`supabase/02_players_extra.sql`](./supabase/02_players_extra.sql) — kontakt/pol/slika igrača, storage bucket, revoke email/phone od anon
3. [`supabase/03_matches.sql`](./supabase/03_matches.sql) — tabela mečeva + RPC `record_match` / `delete_match`

Seed postojećih podataka (jednokratno): `node --env-file=.env.local scripts/seed-supabase.mjs`.

## Lokalni razvoj

```bash
npm install
npm run dev        # http://localhost:3000 (Next dev, čita .env.local)
npm run build      # next build (provera tipova/build-a)
npm run preview    # opennextjs-cloudflare build + wrangler dev (lokalni Worker)
```

`.env.local` mora imati: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_PASSWORD`, `SESSION_SECRET`.

## Admin panel

- `/admin/login` — prijava deljenom lozinkom (`ADMIN_PASSWORD`).
- `/admin/rezultati` — unos rezultata (liga → grupa → ekipe → setovi/predaja). Bodovi i
  tabela se ažuriraju automatski preko RPC-a. Bodovanje: pobeda 2, poraz 1; predaja 6:0 6:0
  (pobednik 2, predao 0, bez gem/set količnika). Mečevi se mogu poništiti (vraća tabelu).
- `/admin/igraci` — izmena/dodavanje igrača (kontakt, pol, fotografija).

## Osvežavanje sa starog API-ja (opciono, jednokratni snapshot)

```bash
node scripts/import.mjs    # upisuje data/*.json
```
