import Link from "next/link";
import { notFound } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { getComments, getLesson, getReactionCounts, getReflections, getSparks, getTickets } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { StatusBadge, TicketTag, SparkMark } from "@/components/badges";
import { ChatSection } from "@/components/chat-section";
import { ReflectionForm } from "@/components/reflection-form";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  const supabase = await createClient();
  const [identity, sparks, tickets, reflections, lessonThread] = await Promise.all([
    getIdentity(),
    getSparks(lesson.id),
    getTickets({ lessonId: lesson.id }),
    getReflections(lesson.id),
    supabase
      .from("threads")
      .select("id, locked")
      .eq("lesson_id", lesson.id)
      .eq("kind", "lesson")
      .maybeSingle()
      .then((r) => r.data),
  ]);

  const chatMessages = lessonThread ? await getComments(lessonThread.id) : [];
  const messageReactions = await getReactionCounts(chatMessages.map((c) => c.id));

  const avgConfidence =
    reflections.filter((r) => r.confidence_rating).length > 0
      ? (
          reflections.reduce((sum, r) => sum + (r.confidence_rating ?? 0), 0) /
          reflections.filter((r) => r.confidence_rating).length
        ).toFixed(1)
      : null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <Link href="/feed" className="text-sm text-stone hover:text-ink transition-colors">
          ← Back to feed
        </Link>
      </div>

      <header className="space-y-2">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">Lesson</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <div className="flex gap-4 text-sm text-stone pt-1">
          <span>
            <span className="font-semibold text-ember-deep">{sparks.length}</span> showcased
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

      {(lesson.description || lesson.image_url) && (
        <article className="bg-card border border-sand rounded-lg p-5 sm:p-6 space-y-4">
          {lesson.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
          )}
          {lesson.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lesson.image_url}
              alt={`Illustration for ${lesson.title}`}
              className="rounded-lg border border-sand max-w-full"
            />
          )}
        </article>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          {lessonThread ? (
            <>
              {lessonThread.locked && (
                <p className="text-sm text-stone bg-sand/50 border border-sand rounded-md px-3 py-2 mb-3">
                  This discussion is locked — replies are closed.
                </p>
              )}
              <ChatSection
                targetId={lessonThread.id}
                targetType="thread"
                comments={chatMessages}
                identityName={identity.name}
                isAdmin={identity.isAdmin}
                readOnly={Boolean(lessonThread.locked)}
                messageReactions={messageReactions}
                heading="Chat"
                placeholder="Share a takeaway, ask about anything unclear…"
              />
            </>
          ) : (
            <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-6 text-center">
              This lesson&apos;s discussion isn&apos;t set up yet.
            </p>
          )}
        </div>

        <aside className="space-y-6">
          <section className="space-y-2">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
              <SparkMark /> Showcase from this lesson
            </h2>
            {sparks.length === 0 ? (
              <p className="text-xs text-stone">Nothing showcased yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {sparks.slice(0, 6).map((s) => (
                  <li key={s.id} className="bg-card border border-sand rounded-lg px-3.5 py-2.5">
                    <Link href={`/sparks/${s.id}`} className="text-sm font-medium hover:text-ember-deep line-clamp-1">
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

          <section className="space-y-2">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
              Struggles from this lesson
            </h2>
            {tickets.length === 0 ? (
              <p className="text-xs text-stone">No blockers reported.</p>
            ) : (
              <ul className="space-y-1.5">
                {tickets.slice(0, 6).map((t) => (
                  <li key={t.id} className="bg-card border border-sand rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <TicketTag number={t.ticket_number} />
                      <Link href={`/tickets/${t.id}`} className="text-sm font-medium hover:text-dusk-deep flex-1 truncate">
                        {t.title}
                      </Link>
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {reflections.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
                Reflections
              </h2>
              <ul className="space-y-1.5">
                {reflections.slice(0, 4).map((r) => (
                  <li key={r.id} className="bg-card border border-sand rounded-lg px-3.5 py-2.5 space-y-0.5">
                    <div className="flex items-center gap-2 text-xs text-stone">
                      <span className="font-medium text-ink">{r.author_name}</span>
                      {r.confidence_rating && <span className="font-mono">{r.confidence_rating}/5</span>}
                    </div>
                    {r.main_takeaway && <p className="text-xs">{r.main_takeaway}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <details className="bg-card border border-sand rounded-lg">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium hover:text-ink text-stone">
              ✍️ Write a reflection
            </summary>
            <div className="px-1 pb-1">
              <ReflectionForm lessonId={lesson.id} />
            </div>
          </details>
        </aside>
      </div>
    </main>
  );
}
