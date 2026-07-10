"use client";

import { useEffect, useState } from "react";
import { addReaction } from "@/lib/actions";
import { COMMENT_EMOJI } from "@/lib/types";

/**
 * Slack-style quick reactions for a chat message: existing counts render as
 * chips, the smiley button opens the palette. One reaction per emoji per
 * browser (remembered locally) — enough honesty for a pilot without auth.
 */
export function EmojiReactions({
  targetId,
  initialCounts,
}: {
  targetId: string;
  initialCounts: Record<string, number>;
}) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(`hibana-emoji:${targetId}`) ?? "[]");
      if (Array.isArray(stored)) setMine(new Set(stored));
    } catch {
      /* fresh browser */
    }
  }, [targetId]);

  async function react(emoji: string) {
    if (mine.has(emoji)) return;
    setOpen(false);
    const nextMine = new Set(mine).add(emoji);
    setMine(nextMine);
    setCounts((c) => ({ ...c, [emoji]: (c[emoji] ?? 0) + 1 }));
    window.localStorage.setItem(`hibana-emoji:${targetId}`, JSON.stringify([...nextMine]));

    const res = await addReaction({ targetId, targetType: "comment", reactionType: emoji });
    if (!res.ok) {
      // roll back the optimistic bump
      setCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 1) - 1) }));
      const rollback = new Set(nextMine);
      rollback.delete(emoji);
      setMine(rollback);
      window.localStorage.setItem(`hibana-emoji:${targetId}`, JSON.stringify([...rollback]));
    }
  }

  const active = COMMENT_EMOJI.filter((e) => (counts[e] ?? 0) > 0);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {active.map((emoji) => (
        <button
          key={emoji}
          onClick={() => react(emoji)}
          disabled={mine.has(emoji)}
          title={mine.has(emoji) ? "You reacted" : `React with ${emoji}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            mine.has(emoji)
              ? "bg-ember-wash border-ember/30 text-ember-deep"
              : "bg-card border-sand hover:border-stone"
          }`}
        >
          <span aria-hidden>{emoji}</span>
          <span className="font-mono">{counts[emoji]}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          title="Add a reaction"
          aria-label="Add a reaction"
          className="inline-flex items-center rounded-full border border-sand bg-card px-2 py-0.5 text-xs text-stone hover:border-stone hover:text-ink transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          🙂+
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-1 z-20 flex gap-0.5 bg-card border border-sand rounded-full px-1.5 py-1 shadow-md">
            {COMMENT_EMOJI.map((emoji) => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                disabled={mine.has(emoji)}
                className="text-base leading-none p-1 rounded-full hover:bg-sand/60 disabled:opacity-40"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
