import Link from "next/link";
import { getClusters, getLessons, getSparks, getTickets } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { ClusterTag, StatusBadge, TicketTag, SparkMark } from "@/components/badges";
import { FeatureToggle } from "@/components/feature-toggle";
import { DeleteContentButton } from "@/components/moderation-controls";
import { SuggestionQueue } from "@/components/suggestion-queue";
import { aiConfigured } from "@/lib/ai-suggest";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [sparks, tickets, clusters, lessons] = await Promise.all([
    getSparks(),
    getTickets(),
    getClusters(),
    getLessons(),
  ]);

  const supabase = await createClient();
  const { count: reactionCount } = await supabase
    .from("reactions")
    .select("id", { count: "exact", head: true });

  const openTickets = tickets.filter(
    (t) => !["resolved", "closed"].includes(t.status),
  );
  const resolvedCount = tickets.filter((t) => t.resolution_status === "solved").length;

  const byLesson = lessons
    .map((lesson) => ({
      lesson,
      tickets: tickets.filter((t) => t.lesson_id === lesson.id),
      sparks: sparks.filter((s) => s.lesson_id === lesson.id),
    }))
    .filter((row) => row.tickets.length > 0 || row.sparks.length > 0);

  const unclustered = tickets.filter(
    (t) => !t.cluster_id && !["resolved", "closed"].includes(t.status),
  );
  const queuedSuggestions = unclustered
    .filter((t) => t.cluster_suggestion && t.cluster_suggestion_review_status === "unreviewed")
    .map((t) => ({
      ticketId: t.id,
      ticketNumber: t.ticket_number,
      ticketTitle: t.title,
      suggestion: t.cluster_suggestion!,
      confidence: t.cluster_suggestion_confidence,
      reason: t.cluster_suggestion_reason,
    }));
  const scannableCount = unclustered.filter(
    (t) => !t.cluster_suggestion && t.cluster_suggestion_review_status === "unreviewed",
  ).length;

  const stats = [
    { label: "Showcase", value: sparks.length, accent: "text-ember-deep" },
    { label: "Struggle tickets", value: tickets.length, accent: "text-dusk" },
    { label: "Open tickets", value: openTickets.length, accent: "text-gold" },
    { label: "Resolved", value: resolvedCount, accent: "text-moss" },
    { label: "Reactions", value: reactionCount ?? 0, accent: "text-ink" },
  ];

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/submit/spark"
          className="rounded-md bg-ember text-white px-3.5 py-1.5 text-sm font-semibold hover:bg-ember-deep transition-colors"
        >
          + Add to Showcase
        </Link>
        <Link
          href="/submit/struggle"
          className="rounded-md bg-dusk text-white px-3.5 py-1.5 text-sm font-semibold hover:bg-dusk-deep transition-colors"
        >
          + New Struggle
        </Link>
        <Link
          href="/threads"
          className="rounded-md bg-ink text-paper px-3.5 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + New Thread
        </Link>
        <Link
          href="/admin/on-behalf"
          className="rounded-md border border-gold/40 bg-gold-wash text-gold px-3.5 py-1.5 text-sm font-semibold hover:border-gold transition-colors"
        >
          📱 Post on behalf
        </Link>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-sand rounded-lg p-4">
            <p className={`font-display text-3xl font-semibold ${s.accent}`}>{s.value}</p>
            <p className="text-xs text-stone mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      <SuggestionQueue
        suggestions={queuedSuggestions}
        scannableCount={scannableCount}
        aiConfigured={aiConfigured()}
      />

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Open tickets</h2>
            <Link href="/admin/tickets" className="text-sm text-stone hover:text-ink underline decoration-sand">
              All tickets →
            </Link>
          </div>
          {openTickets.length === 0 ? (
            <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-6 text-center">
              No struggles reported yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {openTickets.slice(0, 8).map((t) => (
                <li key={t.id} className="bg-card border border-sand rounded-lg px-4 py-3 flex items-center gap-3">
                  <TicketTag number={t.ticket_number} />
                  <Link href={`/tickets/${t.id}`} className="flex-1 text-sm font-medium hover:text-dusk-deep truncate">
                    {t.title}
                  </Link>
                  <StatusBadge status={t.status} />
                  <span className="text-xs text-stone whitespace-nowrap hidden sm:inline">
                    {timeAgo(t.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Common Pains — most affected first</h2>
            <Link href="/admin/clusters" className="text-sm text-stone hover:text-ink underline decoration-sand">
              Manage →
            </Link>
          </div>
          {clusters.length === 0 ? (
            <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-6 text-center">
              No clusters yet. Group repeated tickets into a Common Pain.
            </p>
          ) : (
            <ul className="space-y-2">
              {clusters.map((c) => (
                <li key={c.id} className="bg-card border border-sand rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ClusterTag number={c.cluster_number} />
                    <Link
                      href={`/admin/clusters/${c.id}`}
                      className="flex-1 text-sm font-medium hover:text-gold truncate"
                    >
                      {c.title}
                    </Link>
                    <span className="text-xs text-stone whitespace-nowrap">
                      {c.affected_student_count} affected
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-stone">
                    <span
                      className={
                        c.status === "solution_posted" ? "text-ember-deep font-medium" : undefined
                      }
                    >
                      {c.status === "solution_posted" ? "Solution posted" : "Awaiting solution"}
                    </span>
                    {c.resolution_rate !== null && <span>· {c.resolution_rate}% resolved</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">
          <SparkMark /> Showcase — feature the best work
        </h2>
        {sparks.length === 0 ? (
          <p className="text-sm text-stone">Nothing showcased yet.</p>
        ) : (
          <ul className="space-y-2">
            {sparks.slice(0, 8).map((s) => (
              <li key={s.id} className="bg-card border border-sand rounded-lg px-4 py-3 flex items-center gap-3">
                <Link href={`/sparks/${s.id}`} className="flex-1 text-sm font-medium hover:text-ember-deep truncate">
                  {s.title}
                </Link>
                <span className="text-xs text-stone whitespace-nowrap hidden sm:inline">
                  {s.author_name}
                </span>
                <FeatureToggle sparkId={s.id} featured={s.featured} />
                <DeleteContentButton type="spark_post" id={s.id} label={s.title} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Activity by lesson</h2>
        {byLesson.length === 0 ? (
          <p className="text-sm text-stone">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-stone uppercase tracking-wider">
                  <th className="py-2 pr-4 font-medium">Lesson</th>
                  <th className="py-2 pr-4 font-medium">Struggles</th>
                  <th className="py-2 pr-4 font-medium">Open</th>
                  <th className="py-2 pr-4 font-medium">Showcase</th>
                </tr>
              </thead>
              <tbody>
                {byLesson.map(({ lesson, tickets: lt, sparks: ls }) => (
                  <tr key={lesson.id} className="border-t border-sand">
                    <td className="py-2.5 pr-4">
                      <Link href={`/lessons/${lesson.id}`} className="font-medium hover:text-dusk-deep">
                        {lesson.title}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">{lt.length}</td>
                    <td className="py-2.5 pr-4">
                      {lt.filter((t) => !["resolved", "closed"].includes(t.status)).length}
                    </td>
                    <td className="py-2.5 pr-4">{ls.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
