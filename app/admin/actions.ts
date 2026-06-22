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

export type ActionState = { error?: string; ok?: boolean } | undefined;

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
