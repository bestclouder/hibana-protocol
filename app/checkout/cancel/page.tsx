import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Checkout cancelled</h1>
      <p className="text-stone">
        No charge was made. When you&apos;re ready, the pilot plan is waiting.
      </p>
      <Link
        href="/pricing"
        className="inline-block rounded-md bg-ember text-white px-5 py-2.5 text-sm font-semibold hover:bg-ember-deep"
      >
        Back to pricing
      </Link>
    </main>
  );
}
