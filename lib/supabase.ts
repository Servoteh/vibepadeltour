// Supabase klijenti.
//  - supabasePublic(): anon klijent za javno čitanje (štićeno RLS-om). Koristi se i u
//    server komponentama za prikaz podataka.
//  - supabaseAdmin(): service_role klijent, ISKLJUČIVO server-side (zaobilazi RLS) —
//    koristi se za admin upise. Nikada se ne sme uvoziti u klijentske komponente.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side env (na Cloudflare-u dolazi iz wrangler.jsonc vars / secrets).
const url = () => process.env.SUPABASE_URL;

export function supabasePublic(): SupabaseClient {
  const URL = url();
  const ANON = process.env.SUPABASE_ANON_KEY;
  if (!URL || !ANON) throw new Error("Nedostaju SUPABASE_URL / SUPABASE_ANON_KEY.");
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

export function supabaseAdmin(): SupabaseClient {
  const URL = url();
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !KEY) throw new Error("Nedostaju SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(URL, KEY, { auth: { persistSession: false } });
}
