import Link from "next/link";
import { notFound } from "next/navigation";
import { getComments, getLesson, getReactionCounts, getSpark } from "@/lib/data";
import { fullDate } from "@/lib/format";
import { SPARK_REACTIONS } from "@/lib/types";
import { SparkMark } from "@/components/badges";
import { ReactionBar } from "@/components/reaction-bar";
import { CommentSection } from "@/components/comment-section";

export const dynamic = "force-dynamic";

export default async function SparkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spark = await getSpark(id);
  if (!spark) notFound();

  const [lesson, comments, reactionCounts] = await Promise.all([
    spark.lesson_id ? getLesson(spark.lesson_id) : null,
    getComments(spark.id),
    getReactionCounts([spark.id]),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link href="/feed" className="text-sm text-stone hover:text-ink transition-colors">
          ← Back to feed
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-ember-deep uppercase tracking-wider">
            <SparkMark /> Spark
          </span>
          {spark.featured && (
            <span className="rounded-full bg-ember-wash text-ember-deep border border-ember/25 px-2 py-0.5 font-medium">
              Featured
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight leading-tight">
          {spark.title}
        </h1>
        <p className="text-sm text-stone">
          Shared by <span className="font-medium text-ink">{spark.author_name}</span> ·{" "}
          {fullDate(spark.created_at)}
          {lesson && (
            <>
              {" · "}
              <Link href={`/lessons/${lesson.id}`} className="hover:text-ink underline decoration-sand">
                {lesson.title}
              </Link>
            </>
          )}
        </p>
      </header>

      {(spark.description || spark.image_url || spark.external_link) && (
        <div className="bg-card border border-sand rounded-lg p-5 space-y-4">
          {spark.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{spark.description}</p>
          )}
          {spark.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={spark.image_url}
              alt="Attached image"
              className="rounded-md border border-sand max-w-full"
            />
          )}
          {spark.external_link && (
            <a
              href={spark.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium text-ember-deep underline"
            >
              Check it out →
            </a>
          )}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
          React
        </h2>
        <ReactionBar
          targetId={spark.id}
          targetType="spark_post"
          reactionTypes={SPARK_REACTIONS}
          initialCounts={reactionCounts[spark.id] ?? {}}
        />
      </section>

      <CommentSection targetId={spark.id} targetType="spark_post" comments={comments} />
    </main>
  );
}
