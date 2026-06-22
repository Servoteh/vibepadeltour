"use client";

import { useActionState } from "react";
import Link from "next/link";
import { savePlayer, createPlayer, type ActionState } from "@/app/admin/actions";
import type { Player } from "@/lib/types";

const field = "mt-2 w-full rounded-xl border border-navy/15 bg-paper px-4 py-2.5 text-navy outline-none focus:border-gold/60";
const labelCls = "block text-sm font-medium text-navy";

export function PlayerForm({ player }: { player?: Player }) {
  const isEdit = Boolean(player);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    isEdit ? savePlayer : createPlayer,
    undefined
  );

  return (
    <form action={action} encType="multipart/form-data" className="max-w-xl space-y-5">
      {isEdit && <input type="hidden" name="id" value={player!.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className={labelCls}>Ime</label>
          <input id="first_name" name="first_name" defaultValue={player?.firstName ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="last_name" className={labelCls}>Prezime</label>
          <input id="last_name" name="last_name" defaultValue={player?.lastName ?? ""} className={field} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dob" className={labelCls}>Datum rođenja</label>
          <input id="dob" name="dob" type="date" defaultValue={player?.dob || ""} className={field} />
        </div>
        <div>
          <label htmlFor="gender" className={labelCls}>Pol</label>
          <select id="gender" name="gender" defaultValue={player?.gender || ""} className={field}>
            <option value="">—</option>
            <option value="m">Muški</option>
            <option value="f">Ženski</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelCls}>Email <span className="text-muted">(privatno)</span></label>
          <input id="email" name="email" type="email" defaultValue={player?.email ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>Telefon <span className="text-muted">(privatno)</span></label>
          <input id="phone" name="phone" defaultValue={player?.phone ?? ""} className={field} />
        </div>
      </div>

      {isEdit && (
        <div>
          <label htmlFor="photo" className={labelCls}>Fotografija</label>
          {player?.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photoUrl}
              alt=""
              className="mt-2 h-20 w-20 rounded-full object-cover ring-2 ring-gold/30"
            />
          )}
          <input id="photo" name="photo" type="file" accept="image/*" className={`${field} file:mr-3 file:rounded-full file:border-0 file:bg-navy/10 file:px-3 file:py-1 file:text-sm`} />
          <p className="mt-1 text-xs text-muted">JPG/PNG. Nova slika zamenjuje staru.</p>
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-600/10 px-3 py-2 text-sm text-green-700">Sačuvano.</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink shadow-[var(--shadow-gold)] transition hover:bg-gold-bright disabled:opacity-60"
        >
          {pending ? "Čuvanje…" : isEdit ? "Sačuvaj izmene" : "Dodaj igrača"}
        </button>
        <Link href="/admin/igraci" className="text-sm text-muted hover:text-navy">Nazad na listu</Link>
      </div>
    </form>
  );
}
