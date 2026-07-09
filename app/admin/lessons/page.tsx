import { getLessons } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { LessonManager } from "@/components/lesson-manager";

export const dynamic = "force-dynamic";

export default async function AdminLessonsPage() {
  const lessons = await getLessons();

  // How many posts are tagged with each lesson (shown before deleting)
  const supabase = await createClient();
  const contentCounts: Record<string, number> = {};
  for (const table of ["spark_posts", "struggle_tickets"]) {
    const { data } = await supabase
      .from(table)
      .select("lesson_id")
      .not("lesson_id", "is", null);
    for (const row of data ?? []) {
      contentCounts[row.lesson_id!] = (contentCounts[row.lesson_id!] ?? 0) + 1;
    }
  }

  return (
    <main className="space-y-5">
      <p className="text-sm text-stone max-w-2xl">
        The lesson list is the spine of the feed filters and analytics. Rename or reorder freely —
        deleting a lesson keeps its posts and moves them to &quot;No lesson&quot;.
      </p>
      <LessonManager lessons={lessons} contentCounts={contentCounts} />
    </main>
  );
}
