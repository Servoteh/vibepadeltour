import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin prijava", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <section className="court-grid flex min-h-[70vh] items-center justify-center bg-ink px-5 py-16 text-white">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-white/10 bg-ink-2 p-8 shadow-[var(--shadow-gold)]">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
          Vibe Padel Tour
        </span>
        <h1 className="font-display mt-2 text-2xl font-bold">Admin panel</h1>
        <p className="mt-2 text-sm text-white/50">Prijavi se da bi uneo rezultate i menjao podatke.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </section>
  );
}
