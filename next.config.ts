import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Faza 1 je potpuno statična (sve strane SSG) → static export za Cloudflare Pages.
  // Kada u Fazi 2 dodamo admin/API/Supabase, prelazimo na Cloudflare Next adapter.
  output: "export",
  images: {
    // Cloudflare Pages static export nema Next image optimizaciju na serveru.
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
