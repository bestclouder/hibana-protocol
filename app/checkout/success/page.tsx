import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <p aria-hidden className="text-4xl">✦</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Welcome to the pilot
      </h1>
      <p className="text-stone">
        Payment received — your AOAI Pilot space is live. Head to the organiser console to see
        where your cohort is stuck, or jump into the feed.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/admin"
          className="rounded-md bg-ink text-paper px-5 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          Open organiser console
        </Link>
        <Link
          href="/feed"
          className="rounded-md border border-sand px-5 py-2.5 text-sm font-semibold hover:border-stone"
        >
          Go to the feed
        </Link>
      </div>
    </main>
  );
}
