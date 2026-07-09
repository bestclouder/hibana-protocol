"use client";

export default function FeedError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
      <h1 className="font-display text-2xl font-semibold">Could not load feed</h1>
      <p className="text-stone text-sm">
        Something went wrong while fetching posts. Check your connection and try again.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
