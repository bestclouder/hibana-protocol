import Link from "next/link";
import { notFound } from "next/navigation";
import { getCluster, getLesson, getReactionCounts, getTickets } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { fullDate, timeAgo } from "@/lib/format";
import type { EmailNotification } from "@/lib/types";
import { ClusterTag, StatusBadge, TicketTag } from "@/components/badges";
import { LinkTicketsPanel, UnlinkButton } from "@/components/link-tickets";
import { SolutionEditor } from "@/components/solution-editor";

export const dynamic = "force-dynamic";

export default async function ClusterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cluster = await getCluster(id);
  if (!cluster) notFound();

  const [lesson, linkedTickets, allTickets] = await Promise.all([
    cluster.lesson_id ? getLesson(cluster.lesson_id) : null,
    getTickets({ clusterId: cluster.id }),
    getTickets(),
  ]);
  const candidates = allTickets.filter(
    (t) => !t.cluster_id && !["resolved", "closed"].includes(t.status),
  );
  const reactionCounts = await getReactionCounts(linkedTickets.map((t) => t.id));

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("email_notifications")
    .select("*")
    .eq("cluster_id", cluster.id)
    .order("created_at", { ascending: false });

  const recipients = linkedTickets
    .filter((t) => t.author_email)
    .map((t) => ({ email: t.author_email!, name: t.author_name, ticketNumber: t.ticket_number }));
  const uniqueRecipientCount = new Set(recipients.map((r) => r.email)).size;

  return (
    <main className="space-y-8">
      <div>
        <Link href="/admin/clusters" className="text-sm text-stone hover:text-ink transition-colors">
          ← All Common Pains
        </Link>
      </div>

      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ClusterTag number={cluster.cluster_number} />
          <span
            className={`text-xs font-medium ${
              cluster.status === "solution_posted" ? "text-ember-deep" : "text-dusk"
            }`}
          >
            {cluster.status === "solution_posted" ? "Solution posted" : "Awaiting solution"}
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{cluster.title}</h1>
        {cluster.summary && <p className="text-sm text-stone max-w-2xl">{cluster.summary}</p>}
        <p className="text-xs text-stone">
          {lesson && <>{lesson.title} · </>}
          <span className="font-medium text-gold">{cluster.affected_student_count} students affected</span>
          {cluster.resolution_rate !== null && <> · {cluster.resolution_rate}% resolved</>}
          {" · created "}
          {fullDate(cluster.created_at)}
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">
            Linked tickets{" "}
            <span className="text-stone font-sans text-sm font-normal">({linkedTickets.length})</span>
          </h2>
          {linkedTickets.length === 0 ? (
            <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-6 text-center">
              Link tickets from the ticket list to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {linkedTickets.map((t) => (
                <li key={t.id} className="bg-card border border-sand rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <TicketTag number={t.ticket_number} />
                    <Link href={`/tickets/${t.id}`} className="flex-1 text-sm font-medium hover:text-dusk-deep truncate">
                      {t.title}
                    </Link>
                    <UnlinkButton ticketId={t.id} clusterId={cluster.id} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-stone">
                    <span>{t.author_name}</span>
                    <StatusBadge status={t.status} />
                    <span>🙋 {reactionCounts[t.id]?.i_have_this_too ?? 0}</span>
                    <span>{timeAgo(t.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 className="font-display text-base font-semibold pt-3">Link more tickets</h3>
          <LinkTicketsPanel clusterId={cluster.id} candidates={candidates} />
        </section>

        <section className="space-y-4">
          <SolutionEditor cluster={cluster} recipientCount={uniqueRecipientCount} />

          {(notifications ?? []).length > 0 && (
            <div className="bg-card border border-sand rounded-lg p-4 space-y-2">
              <h3 className="font-display text-base font-semibold">Notification log</h3>
              <ul className="space-y-1.5">
                {(notifications as EmailNotification[]).map((n) => (
                  <li key={n.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={`inline-block size-2 rounded-full ${
                        n.status === "sent"
                          ? "bg-moss"
                          : n.status === "failed"
                            ? "bg-red-500"
                            : "bg-gold"
                      }`}
                    />
                    <span className="font-medium">{n.recipient_email}</span>
                    <span className="text-stone">
                      {n.status}
                      {n.sent_at && ` · ${timeAgo(n.sent_at)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
