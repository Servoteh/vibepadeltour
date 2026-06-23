import { getClubs } from "@/lib/data";
import { ClubsAdmin } from "./ClubsAdmin";

export const dynamic = "force-dynamic";

export default async function KluboviPage() {
  const clubs = await getClubs();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Klubovi</h1>
        <p className="mt-2 text-muted">Kreiranje i izmena klubova (naziv, opis, pravila).</p>
      </div>
      <ClubsAdmin
        clubs={clubs.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? "",
          rules: c.rules ?? "",
        }))}
      />
    </div>
  );
}
