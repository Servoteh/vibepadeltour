import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Faza 2: SSR preko Cloudflare (OpenNext adapter). Strane se renderuju dinamički
  // i čitaju iz Supabase-a, pa admin izmene odmah vide.
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
