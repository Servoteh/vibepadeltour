import Link from "next/link";
import Image from "next/image";
import { Button, SectionHeading, Badge } from "@/components/ui";
import { StatCounter } from "@/components/StatCounter";
import { LeagueCard } from "@/components/LeagueCard";
import { Avatar } from "@/components/Avatar";
import {
  getStats,
  getRanking,
  getClubs,
  getLeaguesForClub,
  getGroups,
  getStandings,
} from "@/lib/data";

export default function Home() {
  const stats = getStats();
  const topRanking = getRanking().slice(0, 10);
  const clubs = getClubs();

  // Istaknute lige: BPK (klub 1), aktivne/poslednje
  const featuredLeagues = getLeaguesForClub(1).slice(0, 3).map((l) => {
    const groups = getGroups(l.clubId, l.id);
    const teams = getStandings(l.clubId, l.id).length;
    return { league: l, groups: groups.length, teams };
  });

  return (
    <>
      {/* HERO */}
      <section className="court-grid relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-gold/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-[420px] w-[420px] rounded-full bg-sea/20 blur-[120px]" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28 lg:pt-24">
          <div className="rise">
            <Badge tone="gold">Premium padel · Adriatic &amp; region</Badge>
            <h1 className="font-display mt-6 text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
              <span className="block text-gold-gradient">VIBE</span>
              <span className="block text-white">PADEL TOUR</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              Regionalni padel tour koji okuplja igrače, klubove, hotele i partnere.
              Lige, rang lista, rezultati i prijave — sve na jednom mestu.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/lige" variant="gold">Pogledaj lige</Button>
              <Button href="/kontakt" variant="outline">Postani igrač</Button>
              <Button href="/kontakt" variant="ghost" className="!text-white !border-white/20 hover:!bg-white/5">
                Postani partner
              </Button>
            </div>
          </div>

          <div className="relative rise">
            <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-tr from-gold/20 to-transparent blur-2xl" />
            <Image
              src="/vpt-logo.png"
              alt="Vibe Padel Tour"
              width={460}
              height={460}
              priority
              className="relative mx-auto w-3/4 max-w-sm drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] lg:w-full"
            />
          </div>
        </div>

        {/* STAT BAND */}
        <div className="relative border-t border-white/10 bg-ink-2/60 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 sm:px-8 md:grid-cols-4">
            <StatCounter value={stats.players} label="Igrača" />
            <StatCounter value={stats.teams} label="Ekipa" />
            <StatCounter value={stats.leagues} label="Liga" />
            <StatCounter value={stats.clubs} label="Klubova" />
          </div>
        </div>
      </section>

      {/* LIGE */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Takmičenja"
            title="Lige i sezone"
            subtitle="Od BPK lige — najveće padel lige u Srbiji — do Jadranskih klubova. Prati grupe, plasmane i raspored kola."
          />
          <Button href="/lige" variant="ghost">Sve lige</Button>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featuredLeagues.map(({ league, groups, teams }) => (
            <LeagueCard
              key={league.id}
              league={league}
              clubName="BPK"
              groups={groups}
              teams={teams}
            />
          ))}
        </div>
      </section>

      {/* RANG + KAKO FUNKCIONISE */}
      <section className="bg-cream-2/50 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="Rang lista"
              title="Top 10 igrača"
              subtitle="Bodovi se sakupljaju kroz sezone i takmičenja Vibe Padel Tour-a."
            />
            <Button href="/rang" variant="ghost" className="mt-6">
              Cela rang lista
            </Button>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-card)] border border-navy/8 bg-paper shadow-[var(--shadow-soft)]">
            {topRanking.map((r, i) => (
              <Link
                key={r.playerId}
                href={`/igraci/${r.playerId}`}
                className="flex items-center gap-4 border-b border-navy/5 px-5 py-3.5 transition last:border-0 hover:bg-cream-2/60"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0
                      ? "bg-gold text-ink"
                      : i < 3
                        ? "bg-gold/15 text-gold-deep"
                        : "text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <Avatar name={`${r.firstName} ${r.lastName}`} size={38} />
                <span className="flex-1 font-medium text-navy">
                  {r.firstName} {r.lastName}
                </span>
                <span className="font-display font-bold text-navy">
                  {r.points}
                  <span className="ml-1 text-xs font-normal text-muted">bod.</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* KLUBOVI / LOKACIJE */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <SectionHeading
          eyebrow="Zajednica"
          title="Klubovi i lokacije"
          subtitle="Vibe Padel Tour raste kroz region — od Beograda do Jadrana."
          align="center"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {clubs.map((c) => (
            <div
              key={c.id}
              className="rounded-[var(--radius-card)] border border-navy/8 bg-paper p-7 shadow-[var(--shadow-soft)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-xl font-bold text-gold-deep">
                {c.name.charAt(0)}
              </div>
              <h3 className="font-display mt-4 text-lg font-bold text-navy">{c.name}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                {c.description?.split("\n")[0] || "Padel klub u okviru Vibe Padel Tour-a."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <div className="court-grid relative overflow-hidden rounded-[2rem] bg-ink px-8 py-16 text-center text-white sm:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-[100px]" />
          <h2 className="font-display relative text-3xl font-bold sm:text-4xl">
            Spreman da zaigraš narednu sezonu?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/70">
            Prijavi ekipu za BPK ligu ili poveži svoj klub i brend sa najbržom padel
            zajednicom u regionu.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/kontakt" variant="gold">Prijavi se</Button>
            <Button href="/kontakt" variant="outline">Postani partner</Button>
          </div>
        </div>
      </section>
    </>
  );
}
