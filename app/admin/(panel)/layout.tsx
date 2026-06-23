import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Pregled" },
  { href: "/admin/rezultati", label: "Unos rezultata" },
  { href: "/admin/raspored", label: "Raspored" },
  { href: "/admin/lige", label: "Lige i kola" },
  { href: "/admin/igraci", label: "Igrači" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy/10 pb-4">
        <nav className="flex flex-wrap items-center gap-1">
          <span className="mr-2 rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
            Admin
          </span>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-navy transition hover:bg-navy/5"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-muted hover:text-navy">
            ↗ Sajt
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy/5"
            >
              Odjava
            </button>
          </form>
        </div>
      </div>

      <div className="py-8">{children}</div>
    </div>
  );
}
