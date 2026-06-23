"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
} from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamStrengthMap } from "@/lib/admin-data";
import { circlePairings, assignSlots, type SchedMatch } from "@/lib/scheduler";

export type ActionState = { error?: string; ok?: boolean; message?: string } | undefined;

const SCHED_HOURS = [17, 18, 19, 20, 21, 22];
const MAX_UNAVAIL_ROUNDS = 3; // max 3 od ~10 kola
const MAX_CANCELLATIONS = 5; // max 5 kola
const CANCEL_MIN_DAYS = 3; // najkasnije 3 dana unapred

async function leagueRoundIds(clubId: number, leagueId: number): Promise<number[]> {
  const { data } = await supabaseAdmin()
    .from("rounds")
    .select("id")
    .eq("club_id", clubId)
    .eq("league_id", leagueId);
  return (data ?? []).map((r) => r.id as number);
}

// ——— Auth ———
export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const pwd = String(formData.get("password") ?? "");
  if (!pwd) return { error: "Unesi lozinku." };
  if (!checkPassword(pwd)) return { error: "Pogrešna lozinka." };
  await createAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

// ——— Igrači ———
function playerFields(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    first_name: str("first_name"),
    last_name: str("last_name"),
    dob: str("dob") || null,
    gender: str("gender") || null,
    email: str("email") || null,
    phone: str("phone") || null,
  };
}

export async function savePlayer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Nedostaje ID igrača." };

  const fields = playerFields(formData);
  if (!fields.first_name && !fields.last_name) return { error: "Unesi ime ili prezime." };

  const update: Record<string, unknown> = { ...fields };
  const sb = supabaseAdmin();

  // Opciona slika → upload u 'player-photos' bucket
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `players/${id}.${ext}`;
    const { error: upErr } = await sb.storage
      .from("player-photos")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (upErr) return { error: `Upload slike: ${upErr.message}` };
    const { data: pub } = sb.storage.from("player-photos").getPublicUrl(path);
    // cache-buster da se nova slika odmah vidi
    update.photo_url = `${pub.publicUrl}?v=${Math.floor(Date.now() / 1000)}`;
  }

  const { error } = await sb.from("players").update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/igraci");
  revalidatePath(`/igraci/${id}`);
  revalidatePath("/admin/igraci");
  revalidatePath(`/admin/igraci/${id}`);
  return { ok: true };
}

export async function createPlayer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const fields = playerFields(formData);
  if (!fields.first_name && !fields.last_name) return { error: "Unesi ime ili prezime." };

  const sb = supabaseAdmin();
  const { data: maxRow, error: maxErr } = await sb
    .from("players")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) return { error: maxErr.message };
  const newId = ((maxRow?.id as number) ?? 0) + 1;

  const { error } = await sb.from("players").insert({ id: newId, ...fields });
  if (error) return { error: error.message };

  revalidatePath("/igraci");
  revalidatePath("/admin/igraci");
  redirect(`/admin/igraci/${newId}`);
}

// ——— Rezultati ———
export async function recordMatch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const groupId = Number(formData.get("group_id"));
  const team1 = Number(formData.get("team1_id"));
  const team2 = Number(formData.get("team2_id"));
  const walkover = formData.get("walkover") === "on";
  const winnerRaw = formData.get("winner");
  const winner = winnerRaw ? Number(winnerRaw) : null;
  const playedOn = String(formData.get("played_on") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim();

  if (!groupId || !team1 || !team2) return { error: "Izaberi grupu i obe ekipe." };
  if (team1 === team2) return { error: "Ista ekipa je izabrana dvaput." };

  const sets: [number, number][] = [];
  if (!walkover) {
    for (let i = 1; i <= 3; i++) {
      const a = formData.get(`set${i}_a`);
      const b = formData.get(`set${i}_b`);
      if (a == null || b == null || a === "" || b === "") continue;
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isFinite(na) || !Number.isFinite(nb) || na < 0 || nb < 0) {
        return { error: `Set ${i}: neispravan rezultat.` };
      }
      sets.push([na, nb]);
    }
    if (sets.length === 0) return { error: "Unesi bar jedan set ili označi predaju." };
  } else if (!winner) {
    return { error: "Za predaju izaberi pobednika." };
  }

  const { error } = await supabaseAdmin().rpc("record_match", {
    p_group_id: groupId,
    p_team1: team1,
    p_team2: team2,
    p_sets: sets,
    p_walkover: walkover,
    p_winner: winner,
    p_round_id: null,
    p_played_on: playedOn,
    p_note: note,
  });
  if (error) return { error: error.message };

  revalidatePath("/rang");
  revalidatePath("/lige", "layout");
  revalidatePath("/admin/rezultati");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteMatch(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("match_id"));
  if (!id) return;
  const { error } = await supabaseAdmin().rpc("delete_match", { p_match_id: id });
  if (error) throw new Error(error.message);

  revalidatePath("/rang");
  revalidatePath("/lige", "layout");
  revalidatePath("/admin/rezultati");
  revalidatePath("/");
}

// ——————————————————— Raspored (Faza 3) ———————————————————

function parseLeague(formData: FormData): [number, number] {
  const [c, l] = String(formData.get("league") ?? "").split(":").map(Number);
  return [c, l];
}

export async function generateProposal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const [clubId, leagueId] = parseLeague(formData);
  const roundId = Number(formData.get("round_id"));
  if (!clubId || !leagueId || !roundId) return { error: "Izaberi ligu i kolo." };

  const sb = supabaseAdmin();

  const { count: acceptedCount } = await sb
    .from("fixtures")
    .select("id", { count: "exact", head: true })
    .eq("round_id", roundId)
    .eq("status", "accepted");
  if ((acceptedCount ?? 0) > 0)
    return { error: "Kolo već ima prihvaćen raspored — prvo ga poništi pa generiši ponovo." };

  // Indeks kola po datumu (za round-robin circle metodu).
  const { data: rounds } = await sb
    .from("rounds")
    .select("id")
    .eq("club_id", clubId)
    .eq("league_id", leagueId)
    .order("date");
  const order = (rounds ?? []).map((r) => r.id as number);
  const roundIndex = order.indexOf(roundId);
  if (roundIndex < 0) return { error: "Kolo ne pripada izabranoj ligi." };

  // Grupe + ekipe iz standings-a.
  const { data: stRows } = await sb
    .from("standings")
    .select("group_id, team_id")
    .eq("club_id", clubId)
    .eq("league_id", leagueId);
  const teamsByGroup = new Map<number, number[]>();
  for (const s of stRows ?? []) {
    const gid = s.group_id as number;
    const list = teamsByGroup.get(gid) ?? teamsByGroup.set(gid, []).get(gid)!;
    list.push(s.team_id as number);
  }

  // Ograničenja za ovo kolo.
  const [unRes, caRes, dbRes] = await Promise.all([
    sb.from("team_unavailability").select("team_id, hour").eq("round_id", roundId),
    sb.from("match_cancellations").select("team_id").eq("round_id", roundId),
    sb.from("team_double_requests").select("team_id, group_id").eq("round_id", roundId),
  ]);
  const unavailable = new Map<number, Set<number>>();
  for (const u of unRes.data ?? []) {
    const t = u.team_id as number;
    const set = unavailable.get(t) ?? unavailable.set(t, new Set<number>()).get(t)!;
    set.add((u.hour as number) ?? -1);
  }
  const cancelled = new Set((caRes.data ?? []).map((c) => c.team_id as number));
  const doubles = (dbRes.data ?? []).map((d) => ({
    team: d.team_id as number,
    group: d.group_id as number,
  }));
  const consecutiveTeams = new Set(doubles.map((d) => d.team));

  const strength = await getTeamStrengthMap();
  const sOf = (a: number, b: number) => (strength.get(a) ?? 0) + (strength.get(b) ?? 0);

  const seen = new Set<string>();
  const matches: SchedMatch[] = [];
  const addPair = (gid: number, a: number, b: number) => {
    if (a === b || cancelled.has(a) || cancelled.has(b)) return;
    const key = `${gid}:${Math.min(a, b)}:${Math.max(a, b)}`;
    if (seen.has(key)) return;
    seen.add(key);
    matches.push({ groupId: gid, team1Id: a, team2Id: b, strength: sOf(a, b) });
  };

  for (const [gid, teamIds] of teamsByGroup) {
    for (const p of circlePairings(teamIds, roundIndex)) addPair(gid, p.aId, p.bId);
  }
  // Dupli termin: dodaj i sledeće kolo (samo par prijavljene ekipe).
  for (const d of doubles) {
    const teamIds = teamsByGroup.get(d.group);
    if (!teamIds) continue;
    for (const p of circlePairings(teamIds, roundIndex + 1)) {
      if (p.aId === d.team || p.bId === d.team) addPair(d.group, p.aId, p.bId);
    }
  }

  const { assigned, unassigned } = assignSlots(matches, {
    unavailable,
    consecutiveTeams,
    hours: SCHED_HOURS,
  });

  await sb.from("fixtures").delete().eq("round_id", roundId).eq("status", "proposed");
  if (assigned.length) {
    const rows = assigned.map((a) => ({
      group_id: a.groupId,
      club_id: clubId,
      league_id: leagueId,
      round_id: roundId,
      team1_id: a.team1Id,
      team2_id: a.team2Id,
      court: a.court,
      hour: a.hour,
      strength: a.strength,
      status: "proposed",
    }));
    const { error } = await sb.from("fixtures").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/raspored");
  return {
    ok: true,
    message: `Raspoređeno ${assigned.length} mečeva${
      unassigned.length ? `, neuspelo ${unassigned.length} (nedostupnost ili nema slobodnih slotova)` : ""
    }.`,
  };
}

export async function acceptProposal(formData: FormData): Promise<void> {
  await requireAdmin();
  const roundId = Number(formData.get("round_id"));
  if (!roundId) return;
  const { error } = await supabaseAdmin()
    .from("fixtures")
    .update({ status: "accepted" })
    .eq("round_id", roundId)
    .eq("status", "proposed");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/raspored");
  revalidatePath("/raspored");
  revalidatePath("/lige", "layout");
}

export async function rejectProposal(formData: FormData): Promise<void> {
  await requireAdmin();
  const roundId = Number(formData.get("round_id"));
  if (!roundId) return;
  const { error } = await supabaseAdmin()
    .from("fixtures")
    .delete()
    .eq("round_id", roundId)
    .eq("status", "proposed");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/raspored");
}

export async function clearRoundSchedule(formData: FormData): Promise<void> {
  await requireAdmin();
  const roundId = Number(formData.get("round_id"));
  if (!roundId) return;
  const { error } = await supabaseAdmin().from("fixtures").delete().eq("round_id", roundId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/raspored");
  revalidatePath("/raspored");
  revalidatePath("/lige", "layout");
}

// ——— Ograničenja (admin unos; kapiten dolazi u Inkrementu 2) ———
export async function addUnavailability(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const [clubId, leagueId] = parseLeague(formData);
  const groupId = Number(formData.get("group_id"));
  const teamId = Number(formData.get("team_id"));
  const roundId = Number(formData.get("round_id"));
  const hourRaw = String(formData.get("hour") ?? "");
  const hour = hourRaw ? Number(hourRaw) : null;
  if (!groupId || !teamId || !roundId) return { error: "Izaberi grupu, ekipu i kolo." };

  const sb = supabaseAdmin();
  const ids = await leagueRoundIds(clubId, leagueId);
  const { data: existing } = await sb
    .from("team_unavailability")
    .select("round_id")
    .eq("team_id", teamId)
    .in("round_id", ids.length ? ids : [-1]);
  const usedRounds = new Set((existing ?? []).map((e) => e.round_id as number));
  if (!usedRounds.has(roundId) && usedRounds.size >= MAX_UNAVAIL_ROUNDS)
    return { error: `Maksimum ${MAX_UNAVAIL_ROUNDS} kola sa nedostupnošću po sezoni.` };

  const { error } = await sb
    .from("team_unavailability")
    .insert({ group_id: groupId, team_id: teamId, round_id: roundId, hour, source: "admin" });
  if (error) return { error: error.message };
  revalidatePath("/admin/raspored");
  return { ok: true };
}

export async function addCancellation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const [clubId, leagueId] = parseLeague(formData);
  const groupId = Number(formData.get("group_id"));
  const teamId = Number(formData.get("team_id"));
  const roundId = Number(formData.get("round_id"));
  if (!groupId || !teamId || !roundId) return { error: "Izaberi grupu, ekipu i kolo." };

  const sb = supabaseAdmin();
  const { data: round } = await sb.from("rounds").select("date").eq("id", roundId).maybeSingle();
  const dateStr = round?.date as string | null | undefined;
  if (dateStr) {
    const diffDays = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < CANCEL_MIN_DAYS)
      return { error: `Otkazivanje je moguće najkasnije ${CANCEL_MIN_DAYS} dana pre kola.` };
  }

  const ids = await leagueRoundIds(clubId, leagueId);
  const { data: existing } = await sb
    .from("match_cancellations")
    .select("round_id")
    .eq("team_id", teamId)
    .in("round_id", ids.length ? ids : [-1]);
  const used = new Set((existing ?? []).map((e) => e.round_id as number));
  if (!used.has(roundId) && used.size >= MAX_CANCELLATIONS)
    return { error: `Maksimum ${MAX_CANCELLATIONS} otkazivanja po sezoni.` };

  const { error } = await sb
    .from("match_cancellations")
    .upsert(
      { group_id: groupId, team_id: teamId, round_id: roundId, source: "admin" },
      { onConflict: "team_id,round_id" }
    );
  if (error) return { error: error.message };
  revalidatePath("/admin/raspored");
  return { ok: true };
}

export async function addDouble(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const teamId = Number(formData.get("team_id"));
  const roundId = Number(formData.get("round_id"));
  if (!groupId || !teamId || !roundId) return { error: "Izaberi grupu, ekipu i kolo." };
  const { error } = await supabaseAdmin()
    .from("team_double_requests")
    .upsert(
      { group_id: groupId, team_id: teamId, round_id: roundId, source: "admin" },
      { onConflict: "team_id,round_id" }
    );
  if (error) return { error: error.message };
  revalidatePath("/admin/raspored");
  return { ok: true };
}

export async function removeConstraint(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const table = String(formData.get("table") ?? "");
  const allowed = ["team_unavailability", "match_cancellations", "team_double_requests"];
  if (!id || !allowed.includes(table)) return;
  const { error } = await supabaseAdmin().from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/raspored");
}
