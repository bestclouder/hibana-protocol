import { createStruggle } from "@/lib/actions";
import { getLessons } from "@/lib/data";
import { SubmitForm } from "@/components/submit-form";

export const dynamic = "force-dynamic";

export default async function SubmitStrugglePage() {
  const lessons = await getLessons();
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-dusk mb-2">
          Struggle ticket
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Report a blocker</h1>
        <p className="text-stone mt-1 text-sm">
          You&apos;ll get a tracked HIB ticket. When the organiser posts a solution for it, you&apos;ll
          be notified by email.
        </p>
      </div>
      <SubmitForm kind="struggle" lessons={lessons} action={createStruggle} />
    </main>
  );
}
