import type { Metadata } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Hibana Protocol",
  description:
    "Where course students share wins, report struggles as tracked tickets, and get notified when solutions land.",
};

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/admin", label: "Organiser" },
  { href: "/pricing", label: "Pricing" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b border-sand bg-card/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/feed" className="flex items-baseline gap-2 group">
              <span aria-hidden className="text-ember text-lg leading-none">火花</span>
              <span className="font-display text-xl font-semibold tracking-tight group-hover:text-ember-deep transition-colors">
                Hibana
              </span>
              <span className="hidden sm:inline font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
                protocol
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-md text-stone hover:text-ink hover:bg-sand/60 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-sand py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-stone">
            <p>
              Hibana Protocol — every struggle becomes a tracked ticket, every
              spark lights the room.
            </p>
            <p className="font-mono tracking-wider">AOAI PILOT</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
