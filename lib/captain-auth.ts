// Kapiten auth — magic-link token. Token (visok entropijski, iz captains.token) je
// sam po sebi kredencijal; čuva se u httpOnly cookie-ju, a verifikuje lookup-om u bazi.
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";

export const CAPTAIN_COOKIE = "vpt_captain";

export type CaptainSession = {
  id: number;
  teamId: number;
  clubId: number;
  leagueId: number;
  name: string;
  email: string;
};

export async function captainByToken(token: string): Promise<CaptainSession | null> {
  if (!token) return null;
  const { data } = await supabaseAdmin().from("captains").select("*").eq("token", token).maybeSingle();
  if (!data) return null;
  return {
    id: data.id as number,
    teamId: data.team_id as number,
    clubId: data.club_id as number,
    leagueId: data.league_id as number,
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
  };
}

export async function currentCaptain(): Promise<CaptainSession | null> {
  const token = (await cookies()).get(CAPTAIN_COOKIE)?.value;
  return token ? captainByToken(token) : null;
}

export async function clearCaptainCookie(): Promise<void> {
  (await cookies()).delete(CAPTAIN_COOKIE);
}
