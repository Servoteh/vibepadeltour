import Link from "next/link";
import { getPlayers, playerName } from "@/lib/data";
import { PlayerAdminList } from "./PlayerAdminList";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const players = await getPlayers();
  const rows = players.map((p) => ({
    id: p.id,
    name: playerName(p),
    hasContact: Boolean(p.email || p.phone),
    hasPhoto: Boolean(p.photoUrl),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-navy">Igrači</h1>
        <Link
          href="/admin/igraci/novi"
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] transition hover:bg-gold-bright"
        >
          + Dodaj igrača
        </Link>
      </div>
      <PlayerAdminList players={rows} />
    </div>
  );
}
