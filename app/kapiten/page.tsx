import type { Metadata } from "next";
import { currentCaptain } from "@/lib/captain-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamProfile } from "@/lib/admin-data";
import { TeamProfile } from "@/components/TeamProfile";
import { CaptainPanel, type CaptainRoundRow } from "./CaptainPanel";
import { captainLogout } from "./actions";

export const metadata: Metadata = { title: "Kapiten", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function KapitenPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const sp = await searchParams;
  const cap = await currentCaptain();

  if (!cap) {
    return (
      <section className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-navy">Kapiten panel</h1>
        <p className="mt-3 text-muted">
          {sp.err
            ? "Link nije važeći ili je istekao. Zatraži novi link od organizatora."
            : "Otvori lični link koji si dobio od organizatora da bi podesio termine svoje ekipe."}
        </p>
      </section>
    );
  }

  const sb = supabaseAdmin();
  const { data: st } = await sb
    .from("standings")
    .select("group_id, team_name")
    .eq("team_id", cap.teamId)
    .eq("league_id", cap.leagueId)
    .maybeSingle();
  const groupId = (st?.group_id as number) ?? 0;
  const teamName = (st?.team_name as string) || cap.name || `Tim ${cap.teamId}`;

  const { data: rounds } = await sb
    .from("rounds")
    .select("id, name, date")
    .eq("club_id", cap.clubId)
    .eq("league_id", cap.leagueId)
    .order("date");
  const ids = (rounds ?? []).map((r) => r.id as number);
  const inIds = ids.length ? ids : [-1];

  const [un, pr, db, ca] = await Promise.all([
    sb.from("team_unavailability").select("round_id").eq("team_id", cap.teamId).in("round_id", inIds),
    sb.from("team_preference").select("round_id, hour").eq("team_id", cap.teamId).in("round_id", inIds),
    sb.from("team_double_requests").select("round_id").eq("team_id", cap.teamId).in("round_id", inIds),
    sb.from("match_cancellations").select("round_id").eq("team_id", cap.teamId).in("round_id", inIds),
  ]);
  const unSet = new Set((un.data ?? []).map((r) => r.round_id as number));
  const prMap = new Map((pr.data ?? []).map((r) => [r.round_id as number, r.hour as number]));
  const dbSet = new Set((db.data ?? []).map((r) => r.round_id as number));
  const caSet = new Set((ca.data ?? []).map((r) => r.round_id as number));

  const rows: CaptainRoundRow[] = (rounds ?? []).map((r) => ({
    id: r.id as number,
    name: (r.name as string) ?? "",
    date: (r.date as string) ?? null,
    can: !unSet.has(r.id as number),
    pref: prMap.get(r.id as number) ?? null,
    dbl: dbSet.has(r.id as number),
    cancel: caSet.has(r.id as number),
  }));

  const profile = await getTeamProfile(cap.clubId, cap.leagueId, cap.teamId);

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">Kapiten</span>
          <h1 className="font-display text-2xl font-bold text-navy">{teamName}</h1>
        </div>
        <form action={captainLogout}>
          <button className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5">
            Odjava
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-muted">
        Označi kad <b>možete</b> da igrate, željeni termin, dupli meč ili otkaži kolo. Limiti: nedostupnost
        max 3 kola, otkazivanje max 5 i najkasnije 3 dana unapred.
      </p>
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-navy">Moj profil</h2>
        <div className="mt-4">
          <TeamProfile profile={profile} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold text-navy">Prijava termina</h2>
        <div className="mt-4">
          <CaptainPanel groupId={groupId} rounds={rows} />
        </div>
      </div>
    </section>
  );
}
