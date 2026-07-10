import Link from "next/link";
import { getIdentity } from "@/lib/auth";
import { getLessons, getSparks, getThreads, getTickets } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { SparkMark, StatusBadge, TicketTag } from "@/components/badges";
import { ThreadForm } from "@/components/thread-form";

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  const [identity, threads, lessons, sparks, tickets] = await Promise.all([
    getIdentity(),
    getThreads(),
    getLessons(),
    getSparks(),
    getTickets(),
  ]);
  const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]));

  // One comments query covers reply counts + last activity for everything
  const allIds = [
    ...(threads ?? []).map((t) => t.id),
    ...sparks.map((s) => s.id),
    ...tickets.map((t) => t.id),
  ];
  const replyCounts: Record<string, number> = {};
  const lastReplyAt: Record<string, string> = {};
  if (allIds.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("comments")
      .select("target_id, created_at")
      .in("target_id", allIds)
      .order("created_at");
    for (const row of data ?? []) {
      replyCounts[row.target_id] = (replyCounts[row.target_id] ?? 0) + 1;
      lastReplyAt[row.target_id] = row.created_at;
    }
  }

  const topics = (threads ?? []).filter((t) => t.kind !== "lesson");
  const lessonThreads = (threads ?? [])
    .filter((t) => t.kind === "lesson")
    .sort(
      (a, b) =>
        (a.lesson_id ? (lessonById[a.lesson_id]?.sort_order ?? 99) : 99) -
        (b.lesson_id ? (lessonById[b.lesson_id]?.sort_order ?? 99) : 99),
    );

  // Sparks + struggles as conversations, most recent activity first
  const conversations = [
    ...sparks.map((s) => ({
      kind: "spark" as const,
      id: s.id,
      href: `/sparks/${s.id}`,
      title: s.title,
      author: s.author_name,
      created_at: s.created_at,
      ticket: null as string | null,
      status: null as string | null,
      lessonId: s.lesson_id,
    })),
    ...tickets.map((t) => ({
      kind: "struggle" as const,
      id: t.id,
      href: `/tickets/${t.id}`,
      title: t.title,
      author: t.author_name,
      created_at: t.created_at,
      ticket: t.ticket_number,
      status: t.status,
      lessonId: t.lesson_id,
    })),
  ].sort((a, b) => {
    const aT = lastReplyAt[a.id] ?? a.created_at;
    const bT = lastReplyAt[b.id] ?? b.created_at;
    return aT < bT ? 1 : -1;
  });

  const activity = (id: string, createdAt: string) => (
    <span className="text-xs text-stone whitespace-nowrap">
      💬 {replyCounts[id] ?? 0} · {timeAgo(lastReplyAt[id] ?? createdAt)}
    </span>
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Threads</h1>
        <p className="text-stone mt-1 text-sm">
          Every conversation in the room — lesson discussions, organiser topics, and the chatter
          around each Spark and Struggle.
        </p>
      </div>

      <div className={`grid gap-8 items-start ${identity.isAdmin ? "lg:grid-cols-[1fr_360px]" : ""}`}>
        <div className="space-y-8 min-w-0">
          <section className="space-y-2">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
              Lesson discussions
            </h2>
            {lessonThreads.length === 0 ? (
              <p className="text-sm text-stone">No lessons yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {lessonThreads.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/threads/${t.id}`}
                      className="flex items-center gap-3 bg-card border border-sand rounded-lg px-4 py-3 hover:border-stone transition-colors"
                    >
                      <span className="text-sm font-medium flex-1 truncate">{t.title}</span>
                      {t.locked && (
                        <span className="rounded-full bg-sand text-stone px-2 py-0.5 text-xs font-medium">
                          Locked
                        </span>
                      )}
                      {activity(t.id, t.created_at)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {topics.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
                Topics from the organiser
              </h2>
              <ul className="space-y-1.5">
                {[...topics]
                  .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                  .map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/threads/${t.id}`}
                        className="flex items-center gap-3 bg-card border border-sand rounded-lg px-4 py-3 hover:border-stone transition-colors"
                      >
                        {t.pinned && (
                          <span className="rounded-full bg-gold-wash text-gold border border-gold/30 px-2 py-0.5 text-xs font-medium">
                            Pinned
                          </span>
                        )}
                        <span className="text-sm font-medium flex-1 truncate">{t.title}</span>
                        {t.locked && (
                          <span className="rounded-full bg-sand text-stone px-2 py-0.5 text-xs font-medium">
                            Locked
                          </span>
                        )}
                        {activity(t.id, t.created_at)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
              Around the Sparks &amp; Struggles
            </h2>
            {conversations.length === 0 ? (
              <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-8 text-center">
                No posts yet — conversations open up as soon as someone shares a Spark or Struggle.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {conversations.slice(0, 20).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={c.href}
                      className="flex items-center gap-2.5 bg-card border border-sand rounded-lg px-4 py-3 hover:border-stone transition-colors"
                    >
                      {c.kind === "spark" ? (
                        <SparkMark className="shrink-0" />
                      ) : (
                        <TicketTag number={c.ticket!} className="shrink-0" />
                      )}
                      <span className="text-sm font-medium flex-1 truncate">{c.title}</span>
                      {c.kind === "struggle" && c.status && (
                        <span className="hidden sm:inline-flex">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <StatusBadge status={c.status as any} />
                        </span>
                      )}
                      {activity(c.id, c.created_at)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {identity.isAdmin && <ThreadForm lessons={lessons} />}
      </div>
    </main>
  );
}
