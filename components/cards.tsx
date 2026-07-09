import Link from "next/link";
import { timeAgo } from "@/lib/format";
import {
  REACTION_EMOJI,
  type Lesson,
  type ReactionType,
  type SparkPost,
  type StruggleTicket,
} from "@/lib/types";
import { SparkMark, StatusBadge, TicketTag } from "@/components/badges";

function ReactionSummary({ counts }: { counts?: Record<string, number> }) {
  const entries = Object.entries(counts ?? {}).filter(([, n]) => n > 0);
  if (entries.length === 0) return null;
  return (
    <span className="flex items-center gap-2 text-xs text-stone">
      {entries.map(([type, n]) => (
        <span key={type} className="inline-flex items-center gap-0.5">
          <span aria-hidden>{REACTION_EMOJI[type as ReactionType]}</span>
          {n}
        </span>
      ))}
    </span>
  );
}

export function SparkCard({
  spark,
  lesson,
  reactionCounts,
  commentCount,
}: {
  spark: SparkPost;
  lesson?: Lesson;
  reactionCounts?: Record<string, number>;
  commentCount?: number;
}) {
  return (
    <article className="bg-card border border-sand rounded-lg overflow-hidden hover:border-ember/40 transition-colors">
      <div className="h-1 bg-ember/70" aria-hidden />
      <div className="p-4 sm:p-5 space-y-2">
        <div className="flex items-center gap-2 flex-wrap text-xs text-stone">
          <span className="inline-flex items-center gap-1 font-medium text-ember-deep uppercase tracking-wider">
            <SparkMark /> Spark
          </span>
          {spark.featured && (
            <span className="rounded-full bg-ember-wash text-ember-deep border border-ember/25 px-2 py-0.5 font-medium">
              Featured
            </span>
          )}
          {lesson && <span className="truncate">· {lesson.title}</span>}
          <span className="ml-auto">{timeAgo(spark.created_at)}</span>
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug">
          <Link href={`/sparks/${spark.id}`} className="hover:text-ember-deep transition-colors">
            {spark.title}
          </Link>
        </h3>
        {spark.description && (
          <p className="text-sm text-stone leading-relaxed line-clamp-3">{spark.description}</p>
        )}
        <div className="flex items-center gap-3 pt-1 text-xs text-stone">
          <span className="font-medium text-ink">{spark.author_name}</span>
          <ReactionSummary counts={reactionCounts} />
          {commentCount ? <span>💬 {commentCount}</span> : null}
        </div>
      </div>
    </article>
  );
}

export function TicketCard({
  ticket,
  lesson,
  reactionCounts,
  commentCount,
}: {
  ticket: StruggleTicket;
  lesson?: Lesson;
  reactionCounts?: Record<string, number>;
  commentCount?: number;
}) {
  return (
    <article className="bg-card border border-sand rounded-lg overflow-hidden hover:border-dusk/40 transition-colors">
      <div className="h-1 bg-dusk/60" aria-hidden />
      <div className="p-4 sm:p-5 space-y-2">
        <div className="flex items-center gap-2 flex-wrap text-xs text-stone">
          <TicketTag number={ticket.ticket_number} />
          <StatusBadge status={ticket.status} />
          {lesson && <span className="truncate">· {lesson.title}</span>}
          <span className="ml-auto">{timeAgo(ticket.created_at)}</span>
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug">
          <Link href={`/tickets/${ticket.id}`} className="hover:text-dusk-deep transition-colors">
            {ticket.title}
          </Link>
        </h3>
        {ticket.description && (
          <p className="text-sm text-stone leading-relaxed line-clamp-3">{ticket.description}</p>
        )}
        <div className="flex items-center gap-3 pt-1 text-xs text-stone">
          <span className="font-medium text-ink">{ticket.author_name}</span>
          <ReactionSummary counts={reactionCounts} />
          {commentCount ? <span>💬 {commentCount}</span> : null}
        </div>
      </div>
    </article>
  );
}
