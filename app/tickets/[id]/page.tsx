import Link from "next/link";
import { notFound } from "next/navigation";
import { getIdentity } from "@/lib/auth";
import { getCluster, getComments, getLesson, getLessons, getReactionCounts, getTicket } from "@/lib/data";
import { fullDate, timeAgo } from "@/lib/format";
import { STRUGGLE_REACTIONS } from "@/lib/types";
import { StatusBadge, TicketTag, ClusterTag } from "@/components/badges";
import { ReactionBar } from "@/components/reaction-bar";
import { ChatSection } from "@/components/chat-section";
import { SolutionPanel } from "@/components/solution-view";
import { ModerationBar } from "@/components/moderation-controls";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const [identity, lesson, cluster, comments] = await Promise.all([
    getIdentity(),
    ticket.lesson_id ? getLesson(ticket.lesson_id) : null,
    ticket.cluster_id ? getCluster(ticket.cluster_id) : null,
    getComments(ticket.id),
  ]);
  const reactionCounts = await getReactionCounts([ticket.id, ...comments.map((c) => c.id)]);
  const allLessons = identity.isAdmin ? await getLessons() : [];

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link href="/feed" className="text-sm text-stone hover:text-ink transition-colors">
          ← Back to feed
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TicketTag number={ticket.ticket_number} />
          <StatusBadge status={ticket.status} />
          {cluster && (
            <span className="inline-flex items-center gap-1 text-xs text-stone">
              in <ClusterTag number={cluster.cluster_number} />
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight leading-tight">
          {ticket.title}
        </h1>
        <p className="text-sm text-stone">
          Reported by <span className="font-medium text-ink">{ticket.author_name}</span> ·{" "}
          {fullDate(ticket.created_at)}
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

      {ticket.description && (
        <div className="bg-card border border-sand rounded-lg p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          {ticket.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ticket.image_url}
              alt="Attached screenshot"
              className="mt-4 rounded-md border border-sand max-w-full"
            />
          )}
        </div>
      )}

      {identity.isAdmin && (
        <ModerationBar
          type="struggle_ticket"
          id={ticket.id}
          lessons={allLessons}
          currentLessonId={ticket.lesson_id}
          redirectAfterDelete="/feed"
        />
      )}

      <SolutionPanel ticket={ticket} cluster={cluster} />

      <section className="space-y-2">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone">
          React
        </h2>
        <ReactionBar
          targetId={ticket.id}
          targetType="struggle_ticket"
          reactionTypes={STRUGGLE_REACTIONS}
          initialCounts={reactionCounts[ticket.id] ?? {}}
        />
      </section>

      <ChatSection
        targetId={ticket.id}
        targetType="struggle_ticket"
        comments={comments}
        identityName={identity.name}
        isAdmin={identity.isAdmin}
        placeholder="Ask a question, share what worked for you…"
        messageReactions={reactionCounts}
      />

      <p className="text-xs text-stone">Last updated {timeAgo(ticket.last_updated_at)}</p>
    </main>
  );
}
