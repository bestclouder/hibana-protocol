import Link from "next/link";
import { notFound } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { getComments, getLesson, getReactionCounts, getThread } from "@/lib/data";
import { fullDate } from "@/lib/format";
import { ChatSection } from "@/components/chat-section";
import { ModerationBar, ThreadFlagButton } from "@/components/moderation-controls";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) notFound();

  const [identity, lesson, replies] = await Promise.all([
    getIdentity(),
    thread.lesson_id ? getLesson(thread.lesson_id) : null,
    getComments(thread.id),
  ]);
  const replyReactions = await getReactionCounts(replies.map((r) => r.id));
  const isLessonThread = thread.kind === "lesson";

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <Link href="/threads" className="text-sm text-stone hover:text-ink transition-colors">
          ← All threads
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-mono uppercase tracking-[0.18em] text-gold">
            {isLessonThread ? "Lesson discussion" : "Organiser thread"}
          </span>
          {thread.pinned && (
            <span className="rounded-full bg-gold-wash text-gold border border-gold/30 px-2 py-0.5 font-medium">
              Pinned
            </span>
          )}
          {thread.locked && (
            <span className="rounded-full bg-sand text-stone px-2 py-0.5 font-medium">Locked</span>
          )}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight leading-tight">
          {thread.title}
        </h1>
        <p className="text-sm text-stone">
          {fullDate(thread.created_at)}
          {lesson && !isLessonThread && (
            <>
              {" · "}
              <Link href={`/lessons/${lesson.id}`} className="hover:text-ink underline decoration-sand">
                {lesson.title}
              </Link>
            </>
          )}
          {lesson && isLessonThread && (
            <>
              {" · "}
              <Link href={`/lessons/${lesson.id}`} className="hover:text-ink underline decoration-sand">
                Lesson page: sparks, struggles &amp; reflections →
              </Link>
            </>
          )}
        </p>
      </header>

      {identity.isAdmin && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <ThreadFlagButton threadId={thread.id} flag="pinned" value={thread.pinned} />
            <ThreadFlagButton threadId={thread.id} flag="locked" value={thread.locked} />
          </div>
          {!isLessonThread && (
            <ModerationBar type="thread" id={thread.id} redirectAfterDelete="/threads" />
          )}
        </div>
      )}

      {thread.body && (
        <div className="bg-card border border-sand rounded-lg p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{thread.body}</p>
        </div>
      )}

      {thread.locked && (
        <p className="text-sm text-stone bg-sand/50 border border-sand rounded-md px-3 py-2">
          This thread is locked — replies are closed.
        </p>
      )}
      <ChatSection
        targetId={thread.id}
        targetType="thread"
        comments={replies}
        identityName={identity.name}
        isAdmin={identity.isAdmin}
        readOnly={thread.locked}
        messageReactions={replyReactions}
        heading="Chat"
        placeholder={
          isLessonThread
            ? "Share a takeaway, ask about anything unclear…"
            : "Write a message…"
        }
      />
    </main>
  );
}
