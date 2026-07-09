import { BuyButton } from "@/components/buy-button";
import { SparkMark } from "@/components/badges";

const FEATURES = [
  "Public wins-and-struggles feed for your whole cohort",
  "Every blocker becomes a tracked HIB ticket",
  "Group repeated problems into Common Pain clusters",
  "Post one solution, email every affected student at once",
  "Solved / Still stuck feedback loop on every ticket",
  "Cohort analytics: where students are stuck, by lesson",
  "Full audit log of every action",
];

export default function PricingPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-10">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-stone mb-3">
          For course organisers
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Stop answering the same question forty times
        </h1>
        <p className="text-stone mt-3 max-w-lg mx-auto">
          Hibana turns your students&apos; scattered struggles into clustered, solvable,
          trackable tickets — and tells everyone at once when the fix lands.
        </p>
      </div>

      <div className="bg-card border border-sand rounded-xl overflow-hidden">
        <div className="h-1.5 bg-ember" aria-hidden />
        <div className="p-8 space-y-6">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-display text-2xl font-semibold">
                <SparkMark /> AOAI Pilot Plan
              </h2>
              <p className="text-sm text-stone mt-1">One cohort space, unlimited students.</p>
            </div>
            <p>
              <span className="font-display text-4xl font-semibold">$499</span>
              <span className="text-stone text-sm"> one-time pilot</span>
            </p>
          </div>
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm">
                <span aria-hidden className="text-ember mt-0.5">✦</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <BuyButton />
        </div>
      </div>
    </main>
  );
}
