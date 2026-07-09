import Link from "next/link";
import { getIdentity } from "@/lib/auth";
import { getLessons, getThreads } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { ThreadForm } from "@/components/thread-form";

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  const [identity, threads, lessons] = await Promise.all([
    getIdentity(),
    getThreads(),
    getLessons(),
  ]);
  const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]));

  // Reply counts
  const replyCounts: Record<string, number> = {};
  if (threads && threads.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("comments")
      .select("target_id")
      .eq("target_type", "thread")
      .in("target_id", threads.map((t) => t.id));
    for (const row of data ?? []) {
      replyCounts[row.target_id] = (replyCounts[row.target_id] ?? 0) + 1;
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Threads</h1>
        <p className="text-stone mt-1 text-sm">
          Targeted conversations started by the organiser — jump in.
        </p>
      </div>

      <div className={`grid gap-8 items-start ${identity.isAdmin ? "lg:grid-cols-[1fr_380px]" : ""}`}>
        <section className="space-y-3">
          {threads === null ? (
            <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-10 text-center">
              Threads are almost ready — the organiser is setting things up. Check back soon.
            </p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-10 text-center">
              No threads yet.
              {identity.isAdmin && " Start the first targeted conversation →"}
            </p>
          ) : (
            <ul className="space-y-2">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/threads/${t.id}`}
                    className="block bg-card border border-sand rounded-lg px-4 py-3.5 hover:border-stone transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {t.pinned && (
                        <span className="rounded-full bg-gold-wash text-gold border border-gold/30 px-2 py-0.5 text-xs font-medium">
                          Pinned
                        </span>
                      )}
                      {t.locked && (
                        <span className="rounded-full bg-sand text-stone px-2 py-0.5 text-xs font-medium">
                          Locked
                        </span>
                      )}
                      <span className="font-display text-base font-semibold flex-1 truncate">
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone">
                      {t.lesson_id && lessonById[t.lesson_id] && (
                        <span>{lessonById[t.lesson_id].title}</span>
                      )}
                      <span>💬 {replyCounts[t.id] ?? 0} replies</span>
                      <span>{timeAgo(t.created_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        {identity.isAdmin && <ThreadForm lessons={lessons} />}
      </div>
    </main>
  );
}
