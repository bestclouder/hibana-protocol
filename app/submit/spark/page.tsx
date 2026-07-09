import { createSpark } from "@/lib/actions";
import { getLessons } from "@/lib/data";
import { SubmitForm } from "@/components/submit-form";
import { SparkMark } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function SubmitSparkPage() {
  const lessons = await getLessons();
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ember-deep mb-2">
          <SparkMark /> Spark
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Share a win</h1>
        <p className="text-stone mt-1 text-sm">
          Pulled something off? Post it — your win is someone else&apos;s map out of the same maze.
        </p>
      </div>
      <SubmitForm kind="spark" lessons={lessons} action={createSpark} />
    </main>
  );
}
