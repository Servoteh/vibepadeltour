# Deploy — Cloudflare Pages

Sajt se automatski deployuje na **Cloudflare Pages** iz ovog GitHub repo-a.
Svaki `git push` na granu `main` pokreće novi build i deploy.

## Jednokratno povezivanje (Cloudflare dashboard)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Izaberi repo **Servoteh/vibepadeltour**, grana **main**.
3. Build podešavanja:
   - **Framework preset:** `Next.js (Static HTML Export)`
   - **Build command:** `npx next build`
   - **Build output directory:** `out`
4. **Environment variables** (Settings → Environment variables):
   - `NODE_VERSION` = `20` (ili `22`)
5. **Save and Deploy.**

Nakon prvog deploya, svaki push na `main` automatski radi novi build.
Custom domen (`vibepadeltour.com`) se dodaje u **Pages → Custom domains**.

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
