"use client";

import { useState } from "react";
import { addReaction } from "@/lib/actions";
import {
  REACTION_EMOJI,
  REACTION_LABELS,
  type ReactionType,
  type TargetType,
} from "@/lib/types";

/**
 * Reaction buttons with optimistic counts — the count updates in the UI the
 * moment the click lands, and rolls back if the server write fails.
 */
export function ReactionBar({
  targetId,
  targetType,
  reactionTypes,
  initialCounts,
}: {
  targetId: string;
  targetType: TargetType;
  reactionTypes: ReactionType[];
  initialCounts: Record<string, number>;
}) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ReactionType | null>(null);

  async function react(type: ReactionType) {
    setBusy(type);
    setError(null);
    setCounts((c) => ({ ...c, [type]: (c[type] ?? 0) + 1 }));
    const res = await addReaction({ targetId, targetType, reactionType: type });
    if (!res.ok) {
      setCounts((c) => ({ ...c, [type]: Math.max(0, (c[type] ?? 1) - 1) }));
      setError(res.message);
    }
    setBusy(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {reactionTypes.map((type) => (
          <button
            key={type}
            onClick={() => react(type)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-sand bg-card px-3 py-1.5 text-sm hover:border-stone hover:bg-sand/40 transition-colors disabled:opacity-60"
          >
            <span aria-hidden>{REACTION_EMOJI[type]}</span>
            <span>{REACTION_LABELS[type]}</span>
            {(counts[type] ?? 0) > 0 && (
              <span className="font-mono text-xs text-stone">{counts[type]}</span>
            )}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
