"use client";

import { useState } from "react";

export function BuyButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const body = await res.json();
      if (res.ok && body.url) {
        window.location.href = body.url;
        return;
      }
      setError(body.error ?? "Could not start checkout. Please try again.");
    } catch {
      setError("Could not start checkout. Please try again.");
    }
    setPending(false);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={checkout}
        disabled={pending}
        className="w-full rounded-md bg-ember text-white px-6 py-3 text-base font-semibold hover:bg-ember-deep transition-colors disabled:opacity-60"
      >
        {pending ? "Opening secure checkout…" : "Buy Now"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <p className="text-xs text-stone text-center">
        Secure payment via Stripe. You&apos;ll be redirected to complete the purchase.
      </p>
    </div>
  );
}
