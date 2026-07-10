import { getLessons } from "@/lib/data";
import { OnBehalfWizard } from "@/components/on-behalf-wizard";

export const dynamic = "force-dynamic";

export default async function OnBehalfPage() {
  const lessons = await getLessons();
  return (
    <main className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Post on behalf of a student</h2>
        <p className="text-sm text-stone mt-1 max-w-xl">
          Drop in a screenshot of the WhatsApp conversation and the AI drafts the post in the
          student&apos;s own voice — you review every word before it goes live, attributed to them.
        </p>
      </div>
      <OnBehalfWizard lessons={lessons} />
    </main>
  );
}
