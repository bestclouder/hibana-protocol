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

/** Horizontal showcase box — the whole card links to the detail page. */
export function ShowcaseCard({
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
    <Link
      href={`/sparks/${spark.id}`}
      className="group w-72 shrink-0 snap-start bg-card border border-sand rounded-lg overflow-hidden hover:border-ember/50 hover:shadow-sm transition-all flex flex-col"
    >
      {spark.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={spark.image_url}
          alt=""
          className="h-32 w-full object-cover border-b border-sand"
        />
      ) : (
        <div
          aria-hidden
          className="h-16 w-full bg-ember-wash border-b border-ember/15 flex items-center justify-center"
        >
          <span className="text-ember text-xl">✦</span>
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs">
          {spark.featured && (
            <span className="rounded-full bg-ember-wash text-ember-deep border border-ember/25 px-2 py-0.5 font-medium">
              Featured
            </span>
          )}
          {lesson && <span className="text-stone truncate">{lesson.title}</span>}
        </div>
        <h3 className="font-display text-base font-semibold leading-snug line-clamp-2 group-hover:text-ember-deep transition-colors">
          {spark.title}
        </h3>
        {spark.description && (
          <p className="text-xs text-stone leading-relaxed line-clamp-2">{spark.description}</p>
        )}
        <div className="flex items-center gap-3 pt-1 mt-auto text-xs text-stone">
          <span className="font-medium text-ink truncate">{spark.author_name}</span>
          <ReactionSummary counts={reactionCounts} />
          {commentCount ? <span>💬 {commentCount}</span> : null}
          <span className="ml-auto whitespace-nowrap">{timeAgo(spark.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

/** Compact forum-style row for the struggles list. */
export function TicketRow({
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
  const meToo = reactionCounts?.i_have_this_too ?? 0;
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="flex items-center gap-3 bg-card border border-sand rounded-lg px-4 py-3 hover:border-dusk/50 transition-colors"
    >
      <TicketTag number={ticket.ticket_number} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{ticket.title}</span>
        <span className="block text-xs text-stone truncate">
          {ticket.author_name}
          {lesson && <> · {lesson.title}</>}
        </span>
      </span>
      <span className="hidden sm:inline-flex">
        <StatusBadge status={ticket.status} />
      </span>
      {meToo > 0 && (
        <span className="text-xs text-stone whitespace-nowrap" title="I have this too">
          🙋 {meToo}
        </span>
      )}
      <span className="text-xs text-stone whitespace-nowrap">💬 {commentCount ?? 0}</span>
      <span className="hidden sm:inline text-xs text-stone whitespace-nowrap">
        {timeAgo(ticket.created_at)}
      </span>
    </Link>
  );
}

export { SparkMark };
