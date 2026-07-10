import { createSpark } from "@/lib/actions";
import { getIdentity } from "@/lib/auth";
import { getLessons } from "@/lib/data";
import { SubmitForm } from "@/components/submit-form";
import { SparkMark } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function SubmitSparkPage() {
  const [lessons, identity] = await Promise.all([getLessons(), getIdentity()]);
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ember-deep mb-2">
          <SparkMark /> Showcase
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Add to the Showcase</h1>
        <p className="text-stone mt-1 text-sm">
          Pulled something off? Show it — your work is someone else&apos;s map out of the same maze.
        </p>
      </div>
      <SubmitForm kind="spark" lessons={lessons} identityName={identity.name} isAdmin={identity.isAdmin} identityEmail={identity.email} action={createSpark} />
    </main>
  );
}
