import { notFound } from "next/navigation";
import { playerName } from "@/lib/data";
import { getPlayerAdmin } from "@/lib/admin-data";
import { PlayerForm } from "../PlayerForm";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayerAdmin(Number(id));
  if (!player) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-navy">{playerName(player)}</h1>
      <PlayerForm player={player} />
    </div>
  );
}
