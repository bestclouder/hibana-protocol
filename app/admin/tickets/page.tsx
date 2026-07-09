import Link from "next/link";
import { getLessons, getReactionCounts, getTickets } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { STATUS_LABELS, type TicketStatus } from "@/lib/types";
import { StatusBadge, TicketTag } from "@/components/badges";
import { DeleteContentButton } from "@/components/moderation-controls";

export const dynamic = "force-dynamic";

const RESOLVED = ["resolved", "closed"];

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; lesson?: string }>;
}) {
  const { status, lesson } = await searchParams;
  const [lessons, tickets] = await Promise.all([
    getLessons(),
    getTickets({ lessonId: lesson, status }),
  ]);
  const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]));
  const reactionCounts = await getReactionCounts(tickets.map((t) => t.id));
  const meToo = (id: string) => reactionCounts[id]?.i_have_this_too ?? 0;

  // Ranking per docs/INTELLIGENCE_LAYER.md: unresolved first, then
  // i-have-this-too count descending, then oldest first
  const ranked = [...tickets].sort((a, b) => {
    const ar = RESOLVED.includes(a.status) ? 1 : 0;
    const br = RESOLVED.includes(b.status) ? 1 : 0;
    if (ar !== br) return ar - br;
    if (meToo(a.id) !== meToo(b.id)) return meToo(b.id) - meToo(a.id);
    return a.created_at < b.created_at ? -1 : 1;
  });

  const filterHref = (params: { status?: string; lesson?: string }) => {
    const q = new URLSearchParams();
    const s = "status" in params ? params.status : status;
    const l = "lesson" in params ? params.lesson : lesson;
    if (s) q.set("status", s);
    if (l) q.set("lesson", l);
    const qs = q.toString();
    return qs ? `/admin/tickets?${qs}` : "/admin/tickets";
  };

  const pill = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
      active ? "bg-ink text-paper" : "bg-sand/60 text-stone hover:text-ink"
    }`;

  return (
    <main className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-stone mr-1">Status:</span>
          <Link href={filterHref({ status: undefined })} className={pill(!status)}>
            All
          </Link>
          {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
            <Link key={s} href={filterHref({ status: s })} className={pill(status === s)}>
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-stone mr-1">Lesson:</span>
          <Link href={filterHref({ lesson: undefined })} className={pill(!lesson)}>
            All
          </Link>
          {lessons.map((l) => (
            <Link key={l.id} href={filterHref({ lesson: l.id })} className={pill(lesson === l.id)}>
              {l.title.replace(/^Lesson \d+: /, "")}
            </Link>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-10 text-center">
          No struggles reported yet.
        </p>
      ) : (
        <div className="overflow-x-auto bg-card border border-sand rounded-lg">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-stone uppercase tracking-wider border-b border-sand">
                <th className="py-2.5 px-4 font-medium">Ticket</th>
                <th className="py-2.5 px-4 font-medium">Title</th>
                <th className="py-2.5 px-4 font-medium">Lesson</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium" title="I have this too">
                  🙋
                </th>
                <th className="py-2.5 px-4 font-medium">Reported</th>
                <th className="py-2.5 px-4 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t) => (
                <tr key={t.id} className="border-b border-sand last:border-b-0 hover:bg-paper/60">
                  <td className="py-2.5 px-4">
                    <TicketTag number={t.ticket_number} />
                  </td>
                  <td className="py-2.5 px-4">
                    <Link href={`/tickets/${t.id}`} className="font-medium hover:text-dusk-deep">
                      {t.title}
                    </Link>
                    <span className="block text-xs text-stone">{t.author_name}</span>
                  </td>
                  <td className="py-2.5 px-4 text-stone text-xs">
                    {t.lesson_id ? lessonById[t.lesson_id]?.title.replace(/^Lesson (\d+): .*/, "L$1") : "—"}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs">{meToo(t.id) || "—"}</td>
                  <td className="py-2.5 px-4 text-xs text-stone whitespace-nowrap">
                    {timeAgo(t.created_at)}
                  </td>
                  <td className="py-2.5 px-4">
                    <DeleteContentButton type="struggle_ticket" id={t.id} label={t.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
