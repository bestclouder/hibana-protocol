import Link from "next/link";
import { getLessons, getReactionCounts, getSparks, getTickets } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { SparkCard, TicketCard } from "@/components/cards";
import { SparkMark } from "@/components/badges";

export const dynamic = "force-dynamic";

type FeedItem =
  | { kind: "spark"; created_at: string; data: Awaited<ReturnType<typeof getSparks>>[number] }
  | { kind: "ticket"; created_at: string; data: Awaited<ReturnType<typeof getTickets>>[number] };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string; show?: string }>;
}) {
  const { lesson: lessonId, show = "all" } = await searchParams;
  const [lessons, sparks, tickets] = await Promise.all([
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

  const featured = sparks.filter((s) => s.featured);
  const items: FeedItem[] = [
    ...(show !== "struggles"
      ? sparks.filter((s) => !s.featured).map((s) => ({ kind: "spark" as const, created_at: s.created_at, data: s }))
      : []),
    ...(show !== "sparks"
      ? tickets.map((t) => ({ kind: "ticket" as const, created_at: t.created_at, data: t }))
      : []),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const showFeatured = show !== "struggles" ? featured : [];

  const filterHref = (params: { lesson?: string; show?: string }) => {
    const q = new URLSearchParams();
    const l = "lesson" in params ? params.lesson : lessonId;
    const s = "show" in params ? params.show : show;
    if (l) q.set("lesson", l);
    if (s && s !== "all") q.set("show", s);
    const qs = q.toString();
    return qs ? `/feed?${qs}` : "/feed";
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            The room where sparks fly
          </h1>
          <p className="text-stone mt-1 text-sm">
            Share a win, or report a blocker — every struggle becomes a tracked ticket.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/submit/spark"
            className="inline-flex items-center gap-1.5 rounded-md bg-ember text-white px-4 py-2 text-sm font-semibold hover:bg-ember-deep transition-colors"
          >
            <SparkMark className="text-white" /> Share a Spark
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
        <aside className="space-y-6">
          <div>
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone mb-2">
              Show
            </h2>
            <nav className="flex lg:flex-col gap-1">
              {[
                { key: "all", label: "Everything" },
                { key: "sparks", label: "Sparks only" },
                { key: "struggles", label: "Struggles only" },
              ].map((opt) => (
                <Link
                  key={opt.key}
                  href={filterHref({ show: opt.key })}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    show === opt.key
                      ? "bg-ink text-paper font-medium"
                      : "text-stone hover:bg-sand/60 hover:text-ink"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone mb-2">
              Lessons
            </h2>
            <nav className="flex lg:flex-col gap-1 flex-wrap">
              <Link
                href={filterHref({ lesson: undefined })}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  !lessonId ? "bg-ink text-paper font-medium" : "text-stone hover:bg-sand/60 hover:text-ink"
                }`}
              >
                All lessons
              </Link>
              {lessons.map((l) => (
                <Link
                  key={l.id}
                  href={filterHref({ lesson: l.id })}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    lessonId === l.id
                      ? "bg-ink text-paper font-medium"
                      : "text-stone hover:bg-sand/60 hover:text-ink"
                  }`}
                >
                  {l.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <section className="space-y-4">
          {showFeatured.map((spark) => (
            <SparkCard
              key={spark.id}
              spark={spark}
              lesson={spark.lesson_id ? lessonById[spark.lesson_id] : undefined}
              reactionCounts={reactionCounts[spark.id]}
              commentCount={commentCounts[spark.id]}
            />
          ))}
          {items.map((item) =>
            item.kind === "spark" ? (
              <SparkCard
                key={item.data.id}
                spark={item.data}
                lesson={item.data.lesson_id ? lessonById[item.data.lesson_id] : undefined}
                reactionCounts={reactionCounts[item.data.id]}
                commentCount={commentCounts[item.data.id]}
              />
            ) : (
              <TicketCard
                key={item.data.id}
                ticket={item.data}
                lesson={item.data.lesson_id ? lessonById[item.data.lesson_id] : undefined}
                reactionCounts={reactionCounts[item.data.id]}
                commentCount={commentCounts[item.data.id]}
              />
            ),
          )}
          {showFeatured.length === 0 && items.length === 0 && (
            <div className="border border-dashed border-sand rounded-lg p-12 text-center">
              <p className="font-display text-lg text-stone">
                No posts yet. Be the first to share a Spark or Struggle.
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Link href="/submit/spark" className="text-sm font-medium text-ember-deep hover:underline">
                  Share a Spark
                </Link>
                <span className="text-stone">·</span>
                <Link href="/submit/struggle" className="text-sm font-medium text-dusk hover:underline">
                  Share a Struggle
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
