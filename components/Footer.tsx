import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="court-grid relative mt-24 bg-ink text-white/70">
      <div className="absolute inset-x-0 top-0 h-px gold-hairline" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/vpt-logo.png"
              alt="Vibe Padel Tour"
              width={52}
              height={52}
              className="rounded-full ring-1 ring-gold/30"
            />
            <span className="font-display text-lg font-bold text-white">
              VIBE<span className="text-gold"> PADEL</span> TOUR
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            Regionalni padel tour koji okuplja igrače, klubove, hotele i partnere.
            Premium padel events across the Adriatic region.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-gold">
            Navigacija
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/lige" className="hover:text-white">Lige</Link></li>
            <li><Link href="/igraci" className="hover:text-white">Igrači</Link></li>
            <li><Link href="/rang" className="hover:text-white">Rang lista</Link></li>
            <li><Link href="/o-nama" className="hover:text-white">O nama</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-gold">
            Kontakt
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="mailto:vibepadeltour@gmail.com" className="hover:text-white">
                vibepadeltour@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+381641822184" className="hover:text-white">
                +381 64 1822 184
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/vibepadeltour/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                @vibepadeltour
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-white/40 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Vibe Padel Tour. Sva prava zadržana.</p>
          <p>Napravljeno sa strašću za padel ⚡</p>
        </div>
      </div>
    </footer>
  );
}
