# Deploy — Cloudflare Workers (static assets)

Sajt se automatski deployuje na **Cloudflare Workers** iz ovog GitHub repo-a preko
**Workers Builds**. Svaki `git push` na granu `main` pokreće novi build i deploy.

Faza 1 je static export → `npm run build` generiše `./out`, a `npx wrangler deploy`
uploaduje te statičke fajlove (konfiguracija u [`wrangler.jsonc`](./wrangler.jsonc)).

## Podešavanja Worker build-a (Cloudflare dashboard)

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`
- **Root directory:** `/`
- (preporučeno) Environment var `NODE_VERSION` = `22`

> `wrangler.jsonc` ima `assets.directory: ./out`, pa `wrangler deploy` uploaduje
> statički sajt bez OpenNext-a. (Bez tog fajla wrangler pokuša OpenNext autoconfig koji
> očekuje server build i puca na `pages-manifest.json`.)

Custom domen (`vibepadeltour.com`) se dodaje u Worker → Settings → Domains & Routes.

## Lokalni razvoj

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → ./out
```

## Osvežavanje podataka (jednokratni snapshot sa starog API-ja)

```bash
node scripts/import.mjs   # upisuje data/*.json
```

## Napomena (Faza 2)

Trenutni build je **static export** (`output: 'export'` u `next.config.ts`) jer je
Faza 1 potpuno statična. Kada dodamo admin panel + Supabase (Faza 2), prelazimo na
Cloudflare Next adapter (`@opennextjs/cloudflare`) za SSR/API rute i podešavamo build
komandu na `npx opennextjs-cloudflare build`.
