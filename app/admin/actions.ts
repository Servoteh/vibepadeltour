"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
} from "@/lib/auth";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamStrengthMap } from "@/lib/admin-data";
import { circlePairings, assignSlots, type SchedMatch } from "@/lib/scheduler";
import { sendMagicLink } from "@/lib/email";

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
  const [unRes, caRes, dbRes, prRes] = await Promise.all([
    sb.from("team_unavailability").select("team_id, hour").eq("round_id", roundId),
    sb.from("match_cancellations").select("team_id").eq("round_id", roundId),
    sb.from("team_double_requests").select("team_id, group_id").eq("round_id", roundId),
    sb.from("team_preference").select("team_id, hour").eq("round_id", roundId),
  ]);
  const preferredHours = new Map<number, number>();
  for (const p of prRes.data ?? []) preferredHours.set(p.team_id as number, p.hour as number);
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
    preferredHours,
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

// ——— Ograničenja (ADMIN unos — bez limita; kapiten sa limitima dolazi u Inkrementu 2) ———
export async function addUnavailability(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const teamId = Number(formData.get("team_id"));
  const roundId = Number(formData.get("round_id"));
  const hourRaw = String(formData.get("hour") ?? "");
  const hour = hourRaw ? Number(hourRaw) : null;
  if (!groupId || !teamId || !roundId) return { error: "Izaberi grupu, ekipu i kolo." };

  const { error } = await supabaseAdmin()
    .from("team_unavailability")
    .insert({ group_id: groupId, team_id: teamId, round_id: roundId, hour, source: "admin" });
  if (error) return { error: error.message };
  revalidatePath("/admin/raspored");
  return { ok: true };
}

export async function addCancellation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const teamId = Number(formData.get("team_id"));
  const roundId = Number(formData.get("round_id"));
  if (!groupId || !teamId || !roundId) return { error: "Izaberi grupu, ekipu i kolo." };

  const { error } = await supabaseAdmin()
    .from("match_cancellations")
    .upsert(
      { group_id: groupId, team_id: teamId, round_id: roundId, source: "admin" },
      { onConflict: "team_id,round_id" }
    );
  if (error) return { error: error.message };
  revalidatePath("/admin/raspored");
  return { ok: true };
}

// Željeni termin: sat kada ekipa MOŽE da igra (pozitivna preferencija).
export async function addPreference(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const teamId = Number(formData.get("team_id"));
  const roundId = Number(formData.get("round_id"));
  const hour = Number(formData.get("hour"));
  if (!groupId || !teamId || !roundId || !hour) return { error: "Izaberi grupu, ekipu, kolo i sat." };

  const { error } = await supabaseAdmin()
    .from("team_preference")
    .upsert(
      { group_id: groupId, team_id: teamId, round_id: roundId, hour, source: "admin" },
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

// ——— Kreiranje kola i liga ———
const DEFAULT_COURTS = [1, 2, 3, 4, 5, 6].map((n) => ({ id: n, name: `Teren ${n}` }));
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function createRound(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const [clubId, leagueId] = parseLeague(formData);
  if (!clubId || !leagueId) return { error: "Izaberi ligu." };
  const date = String(formData.get("date") ?? "").trim() || null;
  const extra = formData.get("extra") === "on";
  let name = String(formData.get("name") ?? "").trim();

  const sb = supabaseAdmin();
  const { data: maxRow } = await sb
    .from("rounds")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  const id = ((maxRow?.id as number) ?? 0) + 1;
  if (!name) {
    const { count } = await sb
      .from("rounds")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("league_id", leagueId);
    name = extra ? "Vanredno kolo" : `Kolo ${(count ?? 0) + 1}`;
  }

  const { error } = await sb.from("rounds").insert({
    id,
    club_id: clubId,
    league_id: leagueId,
    name,
    date,
    start_hour: 17,
    end_hour: 23,
    status: "upcoming",
    extra,
    courts: DEFAULT_COURTS,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/raspored");
  revalidatePath("/admin/lige");
  return { ok: true, message: `Kreirano: ${name}.` };
}

// Auto-kreiranje lige: generiše kola za izabran dan u nedelji u opsegu datuma.
export async function createLeague(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const clubId = Number(formData.get("club_id"));
  const name = String(formData.get("name") ?? "").trim();
  const weekday = Number(formData.get("weekday")); // 0=Ned … 6=Sub
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  if (!clubId || !name) return { error: "Izaberi klub i unesi naziv lige." };

  const sb = supabaseAdmin();
  const { data: maxL } = await sb
    .from("leagues")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  const leagueId = ((maxL?.id as number) ?? 0) + 1;
  const { error: lerr } = await sb
    .from("leagues")
    .insert({ id: leagueId, club_id: clubId, name, description: "", rules: "", status: "upcoming" });
  if (lerr) return { error: lerr.message };

  let createdRounds = 0;
  if (startDate && endDate && !Number.isNaN(weekday)) {
    const dates: Date[] = [];
    const d = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    let guard = 0;
    while (d <= end && guard++ < 400) {
      if (d.getDay() === weekday) dates.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    if (dates.length) {
      const { data: maxR } = await sb
        .from("rounds")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      let rid = (maxR?.id as number) ?? 0;
      const rows = dates.map((dt, i) => ({
        id: ++rid,
        club_id: clubId,
        league_id: leagueId,
        name: `Kolo ${i + 1}`,
        date: fmtDate(dt),
        start_hour: 17,
        end_hour: 23,
        status: "upcoming",
        extra: false,
        courts: DEFAULT_COURTS,
      }));
      const { error: rerr } = await sb.from("rounds").insert(rows);
      if (rerr) return { error: rerr.message };
      createdRounds = rows.length;
    }
  }

  revalidatePath("/admin/lige");
  revalidatePath("/lige", "layout");
  return {
    ok: true,
    message: `Liga „${name}" kreirana${createdRounds ? ` sa ${createdRounds} kola` : ""}.`,
  };
}

// Brzi unos: jedan submit za celo kolo (sve ekizpe grupe/liga).
// can_<tid> (checkbox = može da igra), pref_<tid> (željeni sat), dbl_<tid> (dupli).
export async function saveRoundConstraints(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const roundId = Number(formData.get("round_id"));
  if (!roundId) return { error: "Nedostaje kolo." };

  const parsed = formData
    .getAll("row")
    .map(String)
    .map((r) => {
      const [g, t] = r.split(":").map(Number);
      return { gid: g, tid: t };
    })
    .filter((r) => r.tid);
  const tids = parsed.map((r) => r.tid);

  const sb = supabaseAdmin();
  if (tids.length) {
    await sb.from("team_unavailability").delete().eq("round_id", roundId).in("team_id", tids);
    await sb.from("team_preference").delete().eq("round_id", roundId).in("team_id", tids);
    await sb.from("team_double_requests").delete().eq("round_id", roundId).in("team_id", tids);
  }

  const unavail: Record<string, unknown>[] = [];
  const pref: Record<string, unknown>[] = [];
  const dbl: Record<string, unknown>[] = [];
  for (const { gid, tid } of parsed) {
    const can = formData.has(`can_${tid}`);
    const prefH = String(formData.get(`pref_${tid}`) ?? "");
    const isDbl = formData.has(`dbl_${tid}`);
    if (!can) unavail.push({ group_id: gid, team_id: tid, round_id: roundId, hour: null, source: "admin" });
    if (can && prefH)
      pref.push({ group_id: gid, team_id: tid, round_id: roundId, hour: Number(prefH), source: "admin" });
    if (isDbl) dbl.push({ group_id: gid, team_id: tid, round_id: roundId, source: "admin" });
  }
  if (unavail.length) {
    const { error } = await sb.from("team_unavailability").insert(unavail);
    if (error) return { error: error.message };
  }
  if (pref.length) {
    const { error } = await sb.from("team_preference").insert(pref);
    if (error) return { error: error.message };
  }
  if (dbl.length) {
    const { error } = await sb.from("team_double_requests").insert(dbl);
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/raspored");
  return { ok: true, message: "Sačuvano." };
}

// ——— Kapiteni (magic-link) ———
export async function createCaptain(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const [clubId, leagueId] = parseLeague(formData);
  const [, teamId] = String(formData.get("team") ?? "").split(":").map(Number);
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!clubId || !leagueId || !teamId) return { error: "Izaberi ligu i ekipu." };

  const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
  const { error } = await supabaseAdmin()
    .from("captains")
    .upsert(
      { team_id: teamId, club_id: clubId, league_id: leagueId, email, name, token },
      { onConflict: "team_id,league_id" }
    );
  if (error) return { error: error.message };

  // Pošalji magic-link emailom (ćuti ako nema RESEND_API_KEY).
  let emailed = false;
  if (email) {
    const h = await headers();
    const host = h.get("host") ?? "vibepadeltour.com";
    const proto = h.get("x-forwarded-proto") ?? "https";
    emailed = await sendMagicLink(email, `${proto}://${host}/kapiten/${token}`, name);
  }
  revalidatePath("/admin/kapiteni");
  return {
    ok: true,
    message: emailed ? "Kapiten sačuvan i link poslat na email." : "Kapiten sačuvan (link generisan).",
  };
}

export async function deleteCaptain(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const { error } = await supabaseAdmin().from("captains").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/kapiteni");
}

// ——————————————————— Prioritet 2: admin & podaci ———————————————————

const revalidateLeagues = () => {
  revalidatePath("/admin/lige");
  revalidatePath("/admin/ekipe");
  revalidatePath("/lige", "layout");
  revalidatePath("/");
};

async function nextId(table: string): Promise<number> {
  const { data } = await supabaseAdmin()
    .from(table)
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.id as number) ?? 0) + 1;
}

// ——— Lige ———
export async function updateLeague(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const [clubId, leagueId] = parseLeague(formData);
  if (!clubId || !leagueId) return { error: "Nedostaje liga." };
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim(); // 'active' | 'finished'
  const description = String(formData.get("description") ?? "");
  const rules = String(formData.get("rules") ?? "");
  if (!name) return { error: "Naziv ne sme biti prazan." };

  const { error } = await supabaseAdmin()
    .from("leagues")
    .update({ name, status, description, rules })
    .eq("id", leagueId)
    .eq("club_id", clubId);
  if (error) return { error: error.message };
  revalidateLeagues();
  return { ok: true, message: "Liga sačuvana." };
}

// ——— Grupe ———
export async function createGroup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const [clubId, leagueId] = parseLeague(formData);
  const name = String(formData.get("name") ?? "").trim();
  if (!clubId || !leagueId || !name) return { error: "Izaberi ligu i unesi naziv grupe." };
  const id = await nextId("groups");
  const { error } = await supabaseAdmin()
    .from("groups")
    .insert({ id, club_id: clubId, league_id: leagueId, name });
  if (error) return { error: error.message };
  revalidateLeagues();
  return { ok: true, message: `Grupa „${name}" dodata.` };
}

export async function renameGroup(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const { error } = await supabaseAdmin().from("groups").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateLeagues();
}

export async function deleteGroup(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const { error } = await supabaseAdmin().from("groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateLeagues();
}

// ——— Parovi (timovi) i upis u grupu ———
export async function addPair(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const [clubId, leagueId] = parseLeague(formData);
  const groupId = Number(formData.get("group_id"));
  const p1 = Number(formData.get("player1_id"));
  const p2 = Number(formData.get("player2_id"));
  let name = String(formData.get("name") ?? "").trim();
  if (!clubId || !leagueId || !groupId || !p1 || !p2) return { error: "Izaberi grupu i oba igrača." };
  if (p1 === p2) return { error: "Izaberi dva različita igrača." };

  const sb = supabaseAdmin();
  const { data: players } = await sb.from("players").select("id, first_name, last_name").in("id", [p1, p2]);
  const nm = (id: number) => {
    const pl = (players ?? []).find((x) => (x.id as number) === id);
    return pl ? `${(pl.first_name as string) ?? ""} ${(pl.last_name as string) ?? ""}`.replace(/\s+/g, " ").trim() : `Igrač ${id}`;
  };
  const p1name = nm(p1);
  const p2name = nm(p2);
  if (!name) name = `${p1name} / ${p2name}`;

  const teamId = await nextId("teams");
  const { error: terr } = await sb.from("teams").insert({ id: teamId, player1_id: p1, player2_id: p2, name });
  if (terr) return { error: terr.message };

  const { error: serr } = await sb.from("standings").insert({
    group_id: groupId,
    team_id: teamId,
    club_id: clubId,
    league_id: leagueId,
    team_name: name,
    player1_id: p1,
    player1_name: p1name,
    player2_id: p2,
    player2_name: p2name,
    matches_played: 0,
    matches_won: 0,
    games_diff: 0,
    sets_diff: 0,
    points: 0,
  });
  if (serr) return { error: serr.message };
  revalidateLeagues();
  return { ok: true, message: `Par „${name}" upisan.` };
}

export async function removePair(formData: FormData): Promise<void> {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const teamId = Number(formData.get("team_id"));
  if (!groupId || !teamId) return;
  // Skida par iz grupe (red u standings); sam tim ostaje u bazi.
  const { error } = await supabaseAdmin()
    .from("standings")
    .delete()
    .eq("group_id", groupId)
    .eq("team_id", teamId);
  if (error) throw new Error(error.message);
  revalidateLeagues();
}

// ——— Ručna korekcija standings-a ———
export async function updateStanding(formData: FormData): Promise<void> {
  await requireAdmin();
  const groupId = Number(formData.get("group_id"));
  const teamId = Number(formData.get("team_id"));
  if (!groupId || !teamId) return;
  const num = (k: string) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) ? v : 0;
  };
  const { error } = await supabaseAdmin()
    .from("standings")
    .update({
      matches_played: num("matches_played"),
      matches_won: num("matches_won"),
      points: num("points"),
      games_diff: num("games_diff"),
      sets_diff: num("sets_diff"),
    })
    .eq("group_id", groupId)
    .eq("team_id", teamId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ekipe");
  revalidatePath("/rang");
  revalidatePath("/lige", "layout");
}

// ——— Klubovi ———
export async function createClub(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Naziv kluba je obavezan." };
  const id = await nextId("clubs");
  const { error } = await supabaseAdmin().from("clubs").insert({
    id,
    name,
    description: String(formData.get("description") ?? ""),
    rules: String(formData.get("rules") ?? ""),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/klubovi");
  revalidatePath("/lige", "layout");
  return { ok: true, message: `Klub „${name}" kreiran.` };
}

export async function updateClub(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "Nedostaje klub ili naziv." };
  const { error } = await supabaseAdmin()
    .from("clubs")
    .update({
      name,
      description: String(formData.get("description") ?? ""),
      rules: String(formData.get("rules") ?? ""),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/klubovi");
  revalidatePath("/lige", "layout");
  return { ok: true, message: "Klub sačuvan." };
}

export async function removeConstraint(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const table = String(formData.get("table") ?? "");
  const allowed = [
    "team_unavailability",
    "match_cancellations",
    "team_double_requests",
    "team_preference",
  ];
  if (!id || !allowed.includes(table)) return;
  const { error } = await supabaseAdmin().from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/raspored");
}
