import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "gold" | "outline" | "dark" | "ghost";
  className?: string;
};

export function Button({ href, children, variant = "gold", className = "" }: ButtonProps) {
  const styles: Record<string, string> = {
    gold: "bg-gold text-ink hover:bg-gold-bright shadow-[var(--shadow-gold)]",
    outline: "border border-gold/50 text-gold hover:bg-gold/10",
    dark: "bg-ink text-white hover:bg-ink-2",
    ghost: "text-navy hover:bg-navy/5 border border-navy/15",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  dark = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl`}>
      {eyebrow && (
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-display mt-3 text-3xl font-bold leading-tight sm:text-4xl ${
          dark ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed ${dark ? "text-white/60" : "text-muted"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article";
}) {
  return (
    <As
      className={`rounded-[var(--radius-card)] border border-navy/8 bg-paper shadow-[var(--shadow-soft)] ${className}`}
    >
      {children}
    </As>
  );
}

export function Badge({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "sea" | "muted" | "lime";
}) {
  const tones: Record<string, string> = {
    gold: "bg-gold/15 text-gold-deep",
    sea: "bg-sea/10 text-sea-deep",
    muted: "bg-navy/8 text-muted",
    lime: "bg-lime/20 text-[#5a7a00]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
