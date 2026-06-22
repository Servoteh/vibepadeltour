import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Faza 2: SSR preko Cloudflare (OpenNext adapter). Strane su force-dynamic i čitaju
  // iz Supabase-a na svaki zahtev, pa admin izmene (i unos rezultata) vide se odmah.
  // (Bez `output: "export"` — server actions i SSR ne rade sa statičkim export-om.)
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
