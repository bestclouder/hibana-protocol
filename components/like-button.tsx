"use client";

import { useEffect, useState } from "react";
import { addReaction } from "@/lib/actions";

/** One-tap ❤️ for showcase cards. One like per browser, remembered locally. */
export function LikeButton({
  sparkId,
  initialCount,
}: {
  sparkId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLiked(window.localStorage.getItem(`hibana-heart:${sparkId}`) === "1");
  }, [sparkId]);

  async function like(e: React.MouseEvent) {
    // The whole card is a link — the heart must not navigate
    e.preventDefault();
    e.stopPropagation();
    if (liked || pending) return;
    setPending(true);
    setLiked(true);
    setCount((c) => c + 1);
    window.localStorage.setItem(`hibana-heart:${sparkId}`, "1");
    const res = await addReaction({
      targetId: sparkId,
      targetType: "spark_post",
      reactionType: "heart",
    });
    if (!res.ok) {
      setLiked(false);
      setCount((c) => Math.max(0, c - 1));
      window.localStorage.removeItem(`hibana-heart:${sparkId}`);
    }
    setPending(false);
  }

  return (
    <button
      onClick={like}
      disabled={liked || pending}
      title={liked ? "You like this" : "Like this"}
      aria-label={liked ? "You like this" : "Like this"}
      className={`relative z-10 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
        liked
          ? "bg-ember-wash border-ember/30 text-ember-deep"
          : "bg-card border-sand text-stone hover:border-ember/40 hover:text-ember-deep"
      }`}
    >
      <span aria-hidden>{liked ? "❤️" : "♡"}</span>
      {count > 0 && <span className="font-mono">{count}</span>}
    </button>
  );
}
