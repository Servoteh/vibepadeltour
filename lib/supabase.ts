// Supabase klijenti.
//  - supabasePublic(): anon klijent za javno čitanje (štićeno RLS-om). Koristi se i u
//    server komponentama za prikaz podataka.
//  - supabaseAdmin(): service_role klijent, ISKLJUČIVO server-side (zaobilazi RLS) —
//    koristi se za admin upise. Nikada se ne sme uvoziti u klijentske komponente.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _public: SupabaseClient | null = null;

export function supabasePublic(): SupabaseClient {
  if (!URL || !ANON) {
    throw new Error("Nedostaju NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  if (!_public) {
    _public = createClient(URL, ANON, {
      auth: { persistSession: false },
    });
  }
  return _public;
}

export function supabaseAdmin(): SupabaseClient {
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !KEY) {
    throw new Error("Nedostaju NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(URL, KEY, { auth: { persistSession: false } });
}
