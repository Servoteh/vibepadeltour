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

## ⏳ Prioritet 2 — admin & podaci

- [ ] **CRUD timova/parova** — kreiranje/izmena para (2 igrača + naziv), upis u grupu/standings (sad samo igrači).
- [ ] **CRUD grupa** — dodavanje/izmena grupa unutar lige (za novo-kreirane lige bez grupa).
- [ ] **Upis ekipa u novu ligu** — prijava parova za aktivnu sezonu (povezuje „kreiraj ligu" sa raspored­om).
- [ ] **Izmena lige** — naziv, status (aktivna↔završena), pravila, opis.
- [ ] **CRUD klubova** — naziv, opis, pravila.
- [ ] **Ručna korekcija standings-a** — ispravka bodova/diff bez brisanja meča.
- [ ] **Osvežavanje sa starog API-ja** — dugme/skripta za re-import najnovijih parova (ako zatreba).

---

## ⏳ Prioritet 3 — scheduler poboljšanja

- [ ] Poštovanje **otkazivanja** u predlogu (sad skida par; dodati prikaz „odloženo").
- [ ] **Ne ponavljaj** parove koji su već odigrani (čitaj iz `matches`) pri generisanju.
- [ ] **Balans terena/sati** — ravnomernije raspoređivanje, ne samo teren-2 pravilo.
- [ ] **Ručno prevlačenje** meča u drugi slot pre prihvatanja (drag&drop ili dropdown po ćeliji).
- [ ] **Više dana po kolu** (ako se kolo igra kroz vikend).
- [ ] **Validacije**: upozori kad nema dovoljno slotova ili kad nedostupnost blokira par.

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
