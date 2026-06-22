import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext Cloudflare adapter. Bez R2 incremental cache-a (strane su force-dynamic,
// pa ISR keš nije potreban). Po želji se kasnije može dodati R2 keš.
export default defineCloudflareConfig({});
