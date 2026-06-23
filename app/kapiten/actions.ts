"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentCaptain, clearCaptainCookie } from "@/lib/captain-auth";
import { supabaseAdmin } from "@/lib/supabase";

export type CapState = { error?: string; ok?: boolean } | undefined;

const MAX_UNAVAIL = 3; // max 3 od ~10 kola
const MAX_CANCEL = 5; // max 5 kola
const MIN_DAYS = 3; // otkazivanje najkasnije 3 dana unapred

export async function captainLogout(): Promise<void> {
  await clearCaptainCookie();
  redirect("/");
}

// Kapiten podešava jedno kolo za svoju ekipu (sa limitima).
export async function saveCaptainRound(_prev: CapState, formData: FormData): Promise<CapState> {
  const cap = await currentCaptain();
  if (!cap) return { error: "Niste prijavljeni. Otvorite svoj link ponovo." };

  const roundId = Number(formData.get("round_id"));
  const groupId = Number(formData.get("group_id"));
  if (!roundId || !groupId) return { error: "Nedostaje kolo." };

  const can = formData.has("can");
  const pref = String(formData.get("pref") ?? "");
  const dbl = formData.has("dbl");
  const cancel = formData.has("cancel");

  const sb = supabaseAdmin();

  // Kola lige (za brojanje limita) + datum ovog kola.
  const { data: rounds } = await sb
    .from("rounds")
    .select("id, date")
    .eq("club_id", cap.clubId)
    .eq("league_id", cap.leagueId);
  const ids = (rounds ?? []).map((r) => r.id as number);
  const roundDate = (rounds ?? []).find((r) => (r.id as number) === roundId)?.date as string | undefined;

  const inIds = ids.length ? ids : [-1];
  const [{ data: un }, { data: ca }] = await Promise.all([
    sb.from("team_unavailability").select("round_id").eq("team_id", cap.teamId).in("round_id", inIds),
    sb.from("match_cancellations").select("round_id").eq("team_id", cap.teamId).in("round_id", inIds),
  ]);
  const unRounds = new Set((un ?? []).map((r) => r.round_id as number));
  const caRounds = new Set((ca ?? []).map((r) => r.round_id as number));

  if (!can && !unRounds.has(roundId) && unRounds.size >= MAX_UNAVAIL)
    return { error: `Maksimum ${MAX_UNAVAIL} kola sa nedostupnošću po sezoni.` };

  if (cancel) {
    if (roundDate) {
      const diff = (new Date(roundDate).getTime() - Date.now()) / 86400000;
      if (diff < MIN_DAYS) return { error: `Otkazivanje je moguće najkasnije ${MIN_DAYS} dana pre kola.` };
    }
    if (!caRounds.has(roundId) && caRounds.size >= MAX_CANCEL)
      return { error: `Maksimum ${MAX_CANCEL} otkazivanja po sezoni.` };
  }

  // Reset za ovo kolo (samo za svoju ekipu) pa upis.
  await sb.from("team_unavailability").delete().eq("round_id", roundId).eq("team_id", cap.teamId);
  await sb.from("team_preference").delete().eq("round_id", roundId).eq("team_id", cap.teamId);
  await sb.from("team_double_requests").delete().eq("round_id", roundId).eq("team_id", cap.teamId);
  await sb.from("match_cancellations").delete().eq("round_id", roundId).eq("team_id", cap.teamId);

  const base = { group_id: groupId, team_id: cap.teamId, round_id: roundId, source: "captain" };
  if (!can) await sb.from("team_unavailability").insert({ ...base, hour: null });
  if (can && pref) await sb.from("team_preference").insert({ ...base, hour: Number(pref) });
  if (dbl) await sb.from("team_double_requests").insert(base);
  if (cancel) await sb.from("match_cancellations").insert(base);

  revalidatePath("/kapiten");
  return { ok: true };
}
