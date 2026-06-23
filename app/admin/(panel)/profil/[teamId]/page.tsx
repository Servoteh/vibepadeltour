import Link from "next/link";
import { getTeamProfile } from "@/lib/admin-data";
import { TeamProfile } from "@/components/TeamProfile";

export const dynamic = "force-dynamic";

export default async function AdminProfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ league?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  const [clubId, leagueId] = (sp.league ?? "").split(":").map(Number);

  if (!clubId || !leagueId) {
    return (
      <div className="space-y-3">
        <Link href="/admin/kapiteni" className="text-sm text-muted hover:text-navy">
          ← Kapiteni
        </Link>
        <p className="text-muted">Nedostaje liga (otvori profil iz liste kapitena).</p>
      </div>
    );
  }

  const profile = await getTeamProfile(clubId, leagueId, Number(teamId));

  return (
    <div className="space-y-6">
      <Link href="/admin/kapiteni" className="text-sm text-muted hover:text-navy">
        ← Kapiteni
      </Link>
      <h1 className="font-display text-3xl font-bold text-navy">{profile.teamName}</h1>
      <TeamProfile profile={profile} />
    </div>
  );
}
