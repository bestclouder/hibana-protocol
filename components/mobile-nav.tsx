"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-actions";
import type { Lesson } from "@/lib/types";

/**
 * Mobile hamburger + left navigation drawer. Hidden on md+ screens where
 * the inline header nav takes over.
 */
export function MobileNav({
  nav,
  lessons,
  spaceName,
  userName,
  isAdmin,
}: {
  nav: { href: string; label: string }[];
  lessons: Pick<Lesson, "id" | "title">[];
  spaceName: string | null;
  userName: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close when navigating, lock body scroll while open
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="p-2 -ml-2 rounded-md text-ink hover:bg-sand/60 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-paper border-r border-sand shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-14 border-b border-sand shrink-0">
              <span className="flex items-baseline gap-2">
                <span aria-hidden className="text-ember text-lg leading-none">火花</span>
                <span className="font-display text-lg font-semibold">Hibana</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-md text-stone hover:bg-sand/60"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {spaceName && (
              <div className="px-4 py-3 border-b border-sand">
                <span className="inline-block rounded-full border border-gold/30 bg-gold-wash text-gold px-3 py-1 text-xs font-semibold">
                  {spaceName}
                </span>
              </div>
            )}

            <nav className="px-2 py-3 space-y-0.5">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-ink text-paper"
                      : "text-ink hover:bg-sand/60"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {lessons.length > 0 && (
              <div className="px-2 py-3 border-t border-sand">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone px-3 mb-1.5">
                  Lessons
                </p>
                {lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/lessons/${l.id}`}
                    className="block px-3 py-2 rounded-md text-sm text-stone hover:bg-sand/60 hover:text-ink transition-colors truncate"
                  >
                    {l.title}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-auto px-4 py-4 border-t border-sand">
              {userName ? (
                <div className="space-y-2">
                  <p className="text-xs text-stone">
                    Signed in as{" "}
                    <span className="font-medium text-ink">
                      {isAdmin && <span aria-hidden className="text-ember mr-0.5">✦</span>}
                      {userName}
                    </span>
                  </p>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full rounded-md border border-sand bg-card px-3 py-2 text-sm font-semibold hover:border-stone transition-colors"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="block w-full text-center rounded-md bg-ink text-paper px-3 py-2 text-sm font-semibold hover:opacity-90"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
