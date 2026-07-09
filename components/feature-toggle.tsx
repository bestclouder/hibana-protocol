"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleFeatured } from "@/lib/admin-actions";

export function FeatureToggle({ sparkId, featured }: { sparkId: string; featured: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const res = await toggleFeatured({ sparkId, featured: !featured });
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={featured}
      title={featured ? "Unpin from top of feed" : "Pin to top of feed"}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
        featured
          ? "bg-ember-wash text-ember-deep border-ember/30 hover:bg-ember-wash/60"
          : "border-sand text-stone hover:border-stone hover:text-ink"
      }`}
    >
      <span aria-hidden>✦</span>
      {pending ? "Saving…" : featured ? "Featured" : "Feature"}
    </button>
  );
}
