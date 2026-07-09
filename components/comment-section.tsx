"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addComment } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import type { Comment, TargetType } from "@/lib/types";
import { DeleteCommentButton } from "@/components/moderation-controls";

export function CommentSection({
  targetId,
  targetType,
  comments,
  identityName,
  isAdmin = false,
  readOnly = false,
}: {
  targetId: string;
  targetType: TargetType | "thread";
  comments: Comment[];
  /** Signed-in display name; hides the name field and posts as this user. */
  identityName?: string | null;
  isAdmin?: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (!String(formData.get("body") ?? "").trim()) {
      setError("A comment is required.");
      return;
    }
    if (!identityName && !String(formData.get("author_name") ?? "").trim()) {
      setError("Both your name and a comment are required.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await addComment(formData);
    setPending(false);
    if (res.ok) {
      form.reset();
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  const label = targetType === "thread" ? "Replies" : "Comments";

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold">
        {label}{" "}
        <span className="text-stone font-sans text-sm font-normal">({comments.length})</span>
      </h2>
      {comments.length === 0 ? (
        <p className="text-sm text-stone">
          {readOnly ? "No replies." : "No comments yet — say something helpful."}
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="bg-card border border-sand rounded-lg p-3.5">
              <div className="flex items-center gap-2 text-xs text-stone mb-1">
                <span className="font-medium text-ink">{c.author_name}</span>
                <span>{timeAgo(c.created_at)}</span>
                {isAdmin && (
                  <span className="ml-auto">
                    <DeleteCommentButton commentId={c.id} />
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <input type="hidden" name="target_id" value={targetId} />
          <input type="hidden" name="target_type" value={targetType} />
          <textarea
            name="body"
            rows={3}
            placeholder={targetType === "thread" ? "Add a reply…" : "Add a comment…"}
            className="w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60"
          />
          <div className="flex flex-wrap items-center gap-2">
            {identityName ? (
              <span className="text-xs text-stone">
                Posting as <span className="font-medium text-ink">{identityName}</span>
              </span>
            ) : (
              <input
                name="author_name"
                placeholder="Your name"
                maxLength={100}
                className="rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60"
              />
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Posting…" : targetType === "thread" ? "Post reply" : "Post comment"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
