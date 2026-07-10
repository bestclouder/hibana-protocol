import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-sand">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
            Organiser console
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Where is the cohort stuck?
          </h1>
        </div>
        <nav className="flex gap-1 text-sm">
          <Link href="/admin" className="px-3 py-1.5 rounded-md text-stone hover:text-ink hover:bg-sand/60 font-medium transition-colors">
            Overview
          </Link>
          <Link href="/admin/tickets" className="px-3 py-1.5 rounded-md text-stone hover:text-ink hover:bg-sand/60 font-medium transition-colors">
            Tickets
          </Link>
          <Link href="/admin/clusters" className="px-3 py-1.5 rounded-md text-stone hover:text-ink hover:bg-sand/60 font-medium transition-colors">
            Common Pains
          </Link>
          <Link href="/admin/lessons" className="px-3 py-1.5 rounded-md text-stone hover:text-ink hover:bg-sand/60 font-medium transition-colors">
            Lessons
          </Link>
          <Link href="/threads" className="px-3 py-1.5 rounded-md text-stone hover:text-ink hover:bg-sand/60 font-medium transition-colors">
            Threads
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
