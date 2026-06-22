import { PlayerForm } from "../PlayerForm";

export const dynamic = "force-dynamic";

export default function NewPlayerPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-navy">Novi igrač</h1>
      <p className="text-muted">Sliku možeš dodati nakon kreiranja, na strani za izmenu.</p>
      <PlayerForm />
    </div>
  );
}
