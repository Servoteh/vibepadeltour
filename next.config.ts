import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statički export: strane se generišu u build-u (čitaju iz Supabase-a) i deploy-uju
  // kao statički fajlovi na Cloudflare. Admin izmene se objave novim `npm run deploy`.
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
