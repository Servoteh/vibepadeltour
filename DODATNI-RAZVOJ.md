# Vibe Padel Tour — plan daljeg razvoja

Lista zadataka i ideja, po prioritetu. Štikliramo kako idemo.
Legenda: ✅ gotovo · 🔜 sledeće · ⏳ planirano · 💡 ideja

---

## Urađeno do sada

- ✅ **Faza 1** — dizajn sistem + javne strane (/, /lige, /lige/[clubId]/[leagueId], /igraci, /igraci/[id], /rang, /o-nama, /kontakt), uvezeni podaci, otežana rang lista.
- ✅ **Faza 2** — SSR (OpenNext/Cloudflare), admin login (lozinka + cookie), unos rezultata (RPC + agregat standings), CRUD igrača (kontakt/pol/slika).
- ✅ **Faza 3 / 1** — scheduler (round-robin + mreža 6 terena × 17–23h, teren 2 = najjači, dupli termin uzastopno), admin „Generiši predlog kola" → prihvati/odbij.
- ✅ **Faza 3 / 2** — željeni termin, kreiranje liga (auto kola po danu) i kola/vanrednog kola, admin override limita.
- ✅ **Faza 3 / 3** — raspored samo za aktivne lige, brza tabela (može/termin/dva meča + „Sačuvaj sve"), kapiten magic-link login + kapiten panel sa limitima, admin upravljanje kapitenima.

---

## Prioritet 1 (✅ urađeno 2026-06-23)

### MOJ PROFIL (za ulogovane)
- [x] Kapiten vidi „Moj profil" na `/kapiten`; admin pregled na `/admin/profil/[teamId]` (link iz liste kapitena).
- [x] Statistika: odigrano/pobede/% pobeda/bodovi (`getTeamProfile`).
- [x] Istorija: odigrani mečevi + prijave (nedostupnost/termin/dupli) i otkazivanja.
- [ ] (kasnije) igrač-nalozi, ne samo kapiten, da svako vidi svoj profil.

### Email (Resend)
- [x] Util `lib/email.ts` (Resend HTTP API; ćuti bez `RESEND_API_KEY`) + brendiran šablon.
- [x] Automatsko slanje magic-linka kapitenu pri kreiranju (ako ima email + ključ).
- [ ] **Dodati `RESEND_API_KEY` (+ `EMAIL_FROM`) kao Worker secret** da slanje proradi.
- [ ] Podsetnik pred kolo (`sendReminder` postoji; treba okidač/cron) i obaveštenje pri prihvatanju rasporeda.

### Javni prikaz rasporeda
- [x] Na `/lige/[clubId]/[leagueId]` prikazan **prihvaćen** raspored po kolima (mreža teren×sat).
- [x] Naslovna „Sledeće kolo" — najbliži termini (`getUpcomingFixtures`).
- [ ] Po želji zasebna javna `/raspored` strana.

---

## Prioritet 2 — admin & podaci (✅ urađeno 2026-06-23, osim API refresh)

- [x] **CRUD timova/parova** — `/admin/ekipe`: upis para (2 igrača, auto naziv) u grupu (kreira tim + red u standings), skidanje para iz grupe.
- [x] **CRUD grupa** — `/admin/ekipe`: dodaj/preimenuj/obriši grupu u ligi.
- [x] **Upis ekipa u novu ligu** — preko `/admin/ekipe` (izaberi ligu → grupa → upiši parove).
- [x] **Izmena lige** — `/admin/lige`: status (aktivna↔završena), naziv, opis, pravila.
- [x] **CRUD klubova** — `/admin/klubovi`: kreiranje/izmena (naziv, opis, pravila).
- [x] **Ručna korekcija standings-a** — `/admin/ekipe`: direktna izmena odigrano/pobede/bodovi/gem±/set±.
- [ ] **Osvežavanje sa starog API-ja** — dugme/skripta za re-import najnovijih parova (kasnije, sa „pregled pa potvrdi").

---

## Prioritet 3 — scheduler poboljšanja (✅ urađeno 2026-06-23)

- [x] Otkazivanje → **„Odloženo"**: otkazani parovi se obeleže (admin + javno na strani lige), ne ulaze u mrežu.
- [x] **Ne ponavljaj** već odigrane parove (čita iz `matches`) pri generisanju.
- [x] **Balans paralelno po satu**: mečevi se šire po terenima u istom satu; najjači meč svakog sata na teren 2. Svaki meč = 1 sat.
- [x] **Ručno premeštanje** meča (po ćeliji: izbor teren/sat; zamena ako je zauzeto) pre/posle prihvatanja.
- [x] **Validacije**: poruka koliko je raspoređeno/neuspelo pri generisanju.
- [ ] **Više dana po kolu** (ako se kolo igra kroz vikend) — kasnije.

---

## 💡 Prioritet 4 — kvalitet i UX

- [ ] **Auth očvršćavanje** — rate-limit na login, rotacija `SESSION_SECRET`, opciono Supabase Auth / više admina.
- [ ] **Kapiten UX** — bulk „sačuvaj sve" umesto po kolu; prikaz iskorišćenih limita (npr. 2/3).
- [ ] **Notifikacije** — push/WhatsApp deep-link uz email.
- [ ] **Statistika tura** — najjači parovi, forma, head-to-head.
- [ ] **i18n** — po potrebi EN verzija.
- [ ] **SEO/OG** — dinamičke OG slike za lige/igrače.
- [ ] **Pristupačnost** — provera kontrasta/tastature na admin formama.

---

## 💡 Tehnički dug / infrastruktura

- [ ] **ESLint** — ignoriši `.open-next/` u eslint configu (sad pravi šum); srediti `Navbar.tsx` set-state-in-effect.
- [ ] **Testovi** — zadržati i proširiti unit testove za `lib/scheduler.ts` (i dodati za ranking).
- [ ] **CI provera** — `npm run build` na PR-u pre deploy-a.
- [ ] **Deploy disciplina** — uvek preko GitHub→Workers Build (Linux); ne `wrangler deploy` sa Windows-a.
- [ ] **Migracije** — voditi ih numerisano u `supabase/NN_*.sql` (trenutno do 05); razmotriti tracking primenjenih migracija.
- [ ] **Bekap** — periodični export Supabase baze.

---

## Napomene
- Bodovanje: pobeda 2 / poraz 1; predaja 6:0 6:0 (pobednik 2, predao 0, bez gem/set količnika).
- Limiti kapitena: nedostupnost max 3 kola, otkazivanje max 5 i najkasnije 3 dana unapred. Admin bez limita.
- Raspored se pravi samo za **aktivne** lige (`status != 'finished'`); parovi = standings te sezone.
- Detalji arhitekture i deploy-a: [DEPLOY.md](./DEPLOY.md).
