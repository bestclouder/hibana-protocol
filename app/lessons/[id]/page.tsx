import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson, getReflections, getSparks, getTickets } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { StatusBadge, TicketTag, SparkMark } from "@/components/badges";
import { ReflectionForm } from "@/components/reflection-form";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  const supabase = await createClient();
  const [sparks, tickets, reflections, lessonThread] = await Promise.all([
    getSparks(lesson.id),
    getTickets({ lessonId: lesson.id }),
    getReflections(lesson.id),
    supabase
      .from("threads")
      .select("id")
      .eq("lesson_id", lesson.id)
      .eq("kind", "lesson")
      .maybeSingle()
      .then((r) => r.data),
  ]);

  const avgConfidence =
    reflections.filter((r) => r.confidence_rating).length > 0
      ? (
          reflections.reduce((sum, r) => sum + (r.confidence_rating ?? 0), 0) /
          reflections.filter((r) => r.confidence_rating).length
        ).toFixed(1)
      : null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link href="/feed" className="text-sm text-stone hover:text-ink transition-colors">
          ← Back to feed
        </Link>
      </div>

      <header className="space-y-2">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">Lesson</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        {lesson.description && <p className="text-stone text-sm max-w-2xl">{lesson.description}</p>}
        {lessonThread && (
          <Link
            href={`/threads/${lessonThread.id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            💬 Join the lesson discussion
          </Link>
        )}
        <div className="flex gap-4 text-sm text-stone pt-1">
          <span>
            <span className="font-semibold text-ember-deep">{sparks.length}</span> sparks
          </span>
          <span>
            <span className="font-semibold text-dusk">{tickets.length}</span> struggles
          </span>
          <span>
            <span className="font-semibold text-ink">{reflections.length}</span> reflections
          </span>
          {avgConfidence && (
            <span>
              <span className="font-semibold text-moss">{avgConfidence}/5</span> avg confidence
            </span>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">
              <SparkMark /> Sparks
            </h2>
            {sparks.length === 0 ? (
              <p className="text-sm text-stone">No wins shared for this lesson yet.</p>
            ) : (
              <ul className="space-y-2">
                {sparks.map((s) => (
                  <li key={s.id} className="bg-card border border-sand rounded-lg px-4 py-3">
                    <Link href={`/sparks/${s.id}`} className="text-sm font-medium hover:text-ember-deep">
                      {s.title}
                    </Link>
                    <p className="text-xs text-stone mt-0.5">
                      {s.author_name} · {timeAgo(s.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Struggles</h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-stone">No blockers reported for this lesson.</p>
            ) : (
              <ul className="space-y-2">
                {tickets.map((t) => (
                  <li key={t.id} className="bg-card border border-sand rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TicketTag number={t.ticket_number} />
                      <Link href={`/tickets/${t.id}`} className="text-sm font-medium hover:text-dusk-deep flex-1 truncate">
                        {t.title}
                      </Link>
                      <StatusBadge status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Reflections</h2>
            {reflections.length === 0 ? (
              <p className="text-sm text-stone">
                No reflections yet — be the first to close out this lesson.
              </p>
            ) : (
              <ul className="space-y-2">
                {reflections.map((r) => (
                  <li key={r.id} className="bg-card border border-sand rounded-lg px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-stone">
                      <span className="font-medium text-ink">{r.author_name}</span>
                      {r.confidence_rating && (
                        <span className="font-mono">confidence {r.confidence_rating}/5</span>
                      )}
                      <span>{timeAgo(r.created_at)}</span>
                    </div>
                    {r.main_takeaway && <p className="text-sm">{r.main_takeaway}</p>}
                    {r.what_was_confusing && (
                      <p className="text-xs text-stone">
                        <span className="font-medium">Still fuzzy:</span> {r.what_was_confusing}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <ReflectionForm lessonId={lesson.id} />
      </div>
    </main>
  );
}
