import Link from "next/link";
import { getLessons, getReactionCounts, getSpace, getSparks, getTickets } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ShowcaseCard, TicketRow } from "@/components/cards";
import { ShowcaseRail } from "@/components/showcase-rail";
import { SparkMark } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { lesson: lessonId } = await searchParams;
  const [space, lessons, sparks, tickets] = await Promise.all([
    getSpace(),
    getLessons(),
    getSparks(lessonId),
    getTickets({ lessonId }),
  ]);
  const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]));

  const targetIds = [...sparks.map((s) => s.id), ...tickets.map((t) => t.id)];
  const supabase = await createClient();
  const [reactionCounts, commentRows] = await Promise.all([
    getReactionCounts(targetIds),
    targetIds.length > 0
      ? supabase.from("comments").select("target_id").in("target_id", targetIds)
      : Promise.resolve({ data: [] }),
  ]);
  const commentCounts: Record<string, number> = {};
  for (const row of commentRows.data ?? []) {
    commentCounts[row.target_id] = (commentCounts[row.target_id] ?? 0) + 1;
  }

  // Open work first, resolved sinks; newest within each group
  const sortedTickets = [...tickets].sort((a, b) => {
    const aDone = ["resolved", "closed"].includes(a.status) ? 1 : 0;
    const bDone = ["resolved", "closed"].includes(b.status) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return a.created_at < b.created_at ? 1 : -1;
  });

  const lessonHref = (id?: string) => (id ? `/feed?lesson=${id}` : "/feed");

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          {space && (
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold mb-1.5">
              {space.name}
            </p>
          )}
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            The room where sparks fly
          </h1>
          <p className="text-stone mt-1 text-sm">
            {space?.description ??
              "Show off what you've built, or report a blocker — every struggle becomes a tracked ticket."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/submit/spark"
            className="inline-flex items-center gap-1.5 rounded-md bg-ember text-white px-4 py-2 text-sm font-semibold hover:bg-ember-deep transition-colors"
          >
            <SparkMark className="text-white" /> Add to Showcase
          </Link>
          <Link
            href="/submit/struggle"
            className="inline-flex items-center gap-1.5 rounded-md bg-dusk text-white px-4 py-2 text-sm font-semibold hover:bg-dusk-deep transition-colors"
          >
            Share a Struggle
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <aside>
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone mb-2">
            Lessons
          </h2>
          <nav className="flex lg:flex-col gap-1 flex-wrap">
            {lessons.map((l) => (
              <Link
                key={l.id}
                href={`/lessons/${l.id}`}
                className="px-3 py-1.5 rounded-md text-sm text-stone hover:bg-sand/60 hover:text-ink transition-colors"
              >
                {l.title}
              </Link>
            ))}
            {lessonId && (
              <Link
                href={lessonHref()}
                className="px-3 py-1.5 rounded-md text-sm bg-ink text-paper font-medium"
              >
                ← Clear lesson filter
              </Link>
            )}
          </nav>
        </aside>

        <div className="space-y-10 min-w-0">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">
                <SparkMark /> Showcase
              </h2>
              <p className="text-xs text-stone">What students have pulled off — click in to see how</p>
            </div>
            {sparks.length === 0 ? (
              <div className="border border-dashed border-sand rounded-lg p-8 text-center">
                <p className="text-sm text-stone">
                  Nothing in the showcase yet — be the first to share your work.
                </p>
                <Link
                  href="/submit/spark"
                  className="inline-block mt-2 text-sm font-medium text-ember-deep hover:underline"
                >
                  Add to Showcase →
                </Link>
              </div>
            ) : (
              <ShowcaseRail>
                {sparks.map((spark) => (
                  <ShowcaseCard
                    key={spark.id}
                    spark={spark}
                    lesson={spark.lesson_id ? lessonById[spark.lesson_id] : undefined}
                    reactionCounts={reactionCounts[spark.id]}
                    commentCount={commentCounts[spark.id]}
                  />
                ))}
              </ShowcaseRail>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">Struggles</h2>
              <p className="text-xs text-stone">Blockers being worked through — jump in if you can help</p>
            </div>
            {sortedTickets.length === 0 ? (
              <div className="border border-dashed border-sand rounded-lg p-8 text-center">
                <p className="text-sm text-stone">No open struggles — smooth sailing right now.</p>
                <Link
                  href="/submit/struggle"
                  className="inline-block mt-2 text-sm font-medium text-dusk hover:underline"
                >
                  Report a blocker →
                </Link>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {sortedTickets.map((ticket) => (
                  <li key={ticket.id}>
                    <TicketRow
                      ticket={ticket}
                      lesson={ticket.lesson_id ? lessonById[ticket.lesson_id] : undefined}
                      reactionCounts={reactionCounts[ticket.id]}
                      commentCount={commentCounts[ticket.id]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
