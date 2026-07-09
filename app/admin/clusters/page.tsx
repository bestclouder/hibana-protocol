import Link from "next/link";
import { getClusters, getLessons } from "@/lib/data";
import { ClusterTag } from "@/components/badges";
import { ClusterForm } from "@/components/cluster-form";

export const dynamic = "force-dynamic";

export default async function AdminClustersPage() {
  const [clusters, lessons] = await Promise.all([getClusters(), getLessons()]);
  const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]));

  return (
    <main className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">
          Common Pains{" "}
          <span className="text-stone font-sans text-sm font-normal">
            ranked by affected students
          </span>
        </h2>
        {clusters.length === 0 ? (
          <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-10 text-center">
            No clusters yet. When several tickets describe the same problem, group them here and
            solve them all at once.
          </p>
        ) : (
          <ul className="space-y-2">
            {clusters.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/clusters/${c.id}`}
                  className="block bg-card border border-sand rounded-lg px-4 py-3.5 hover:border-gold/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ClusterTag number={c.cluster_number} />
                    <span className="flex-1 text-sm font-medium truncate">{c.title}</span>
                    <span className="font-display text-xl font-semibold text-gold">
                      {c.affected_student_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-stone">
                    {c.lesson_id && lessonById[c.lesson_id] && (
                      <span>{lessonById[c.lesson_id].title}</span>
                    )}
                    <span
                      className={
                        c.status === "solution_posted"
                          ? "text-ember-deep font-medium"
                          : "text-dusk font-medium"
                      }
                    >
                      {c.status === "solution_posted" ? "Solution posted" : "Awaiting solution"}
                    </span>
                    {c.resolution_rate !== null && <span>{c.resolution_rate}% resolved</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ClusterForm lessons={lessons} />
    </main>
  );
}
