import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  weight: ["500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vibepadeltour.com"),
  title: {
    default: "Vibe Padel Tour — Premium padel na Jadranu i u regionu",
    template: "%s · Vibe Padel Tour",
  },
  description:
    "Vibe Padel Tour — regionalni padel tour koji okuplja igrače, klubove i partnere. Lige, rang lista, igrači i rezultati na jednom mestu.",
  keywords: ["padel", "Vibe Padel Tour", "BPK liga", "padel Srbija", "padel liga", "rang lista"],
  openGraph: {
    title: "Vibe Padel Tour",
    description: "Premium padel events across the Adriatic region.",
    type: "website",
    locale: "sr_RS",
  },
  icons: { icon: "/vpt-logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-navy">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
