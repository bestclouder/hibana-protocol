import type { Metadata } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { getIdentity } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import { getSpace } from "@/lib/data";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [identity, space] = await Promise.all([getIdentity(), getSpace()]);
  const nav = [
    { href: "/feed", label: "Feed" },
    { href: "/threads", label: "Threads" },
    ...(identity.isAdmin ? [{ href: "/admin", label: "Organiser" }] : []),
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b border-sand bg-card/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/feed" className="flex items-baseline gap-2 group shrink-0">
                <span aria-hidden className="text-ember text-lg leading-none">火花</span>
                <span className="font-display text-xl font-semibold tracking-tight group-hover:text-ember-deep transition-colors">
                  Hibana
                </span>
                <span className="hidden sm:inline font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
                  protocol
                </span>
              </Link>
              {space && (
                <span
                  className="truncate rounded-full border border-gold/30 bg-gold-wash text-gold px-3 py-1 text-xs font-semibold"
                  title={space.description ?? space.name}
                >
                  {space.name}
                </span>
              )}
            </div>
            <nav className="flex items-center gap-1 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-md text-stone hover:text-ink hover:bg-sand/60 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
              {identity.user ? (
                <div className="flex items-center gap-2 pl-2 ml-1 border-l border-sand">
                  <span className="hidden sm:inline text-xs text-stone max-w-36 truncate" title={identity.email ?? undefined}>
                    {identity.isAdmin && <span aria-hidden className="text-ember mr-1">✦</span>}
                    {identity.name}
                  </span>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-md text-stone hover:text-ink hover:bg-sand/60 transition-colors font-medium"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="ml-1 px-3 py-1.5 rounded-md bg-ink text-paper font-medium hover:opacity-90 transition-opacity"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-sand py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-stone">
            <p>
              Hibana Protocol — every struggle becomes a tracked ticket, every showcase lights the room.
            </p>
            <p className="font-mono tracking-wider">PILOT</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
