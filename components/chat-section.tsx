"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addComment } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import type { Comment, TargetType } from "@/lib/types";
import { DeleteCommentButton } from "@/components/moderation-controls";

/**
 * Chat-style discussion: message rows plus a compact composer.
 * Enter sends, Shift+Enter adds a line. Anonymous visitors get a small
 * inline name field (remembered locally); signed-in users just type.
 */
export function ChatSection({
  targetId,
  targetType,
  comments,
  identityName,
  isAdmin = false,
  readOnly = false,
  heading = "Discussion",
  placeholder = "Write a message…",
}: {
  targetId: string;
  targetType: TargetType | "thread";
  comments: Comment[];
  identityName?: string | null;
  isAdmin?: boolean;
  readOnly?: boolean;
  heading?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!identityName) {
      setName(window.localStorage.getItem("hibana-chat-name") ?? "");
    }
  }, [identityName]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    const author = identityName ?? name.trim();
    if (!author) {
      setError("Add your name so people know who's talking.");
      return;
    }
    setError(null);
    setPending(true);
    const formData = new FormData();
    formData.set("target_id", targetId);
    formData.set("target_type", targetType);
    formData.set("body", text);
    formData.set("author_name", author);
    const res = await addComment(formData);
    setPending(false);
    if (res.ok) {
      setBody("");
      if (!identityName) window.localStorage.setItem("hibana-chat-name", author);
      router.refresh();
      textareaRef.current?.focus();
    } else {
      setError(res.message);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!pending) void send();
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold">
        {heading}{" "}
        <span className="text-stone font-sans text-sm font-normal">({comments.length})</span>
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-stone px-1">
          {readOnly ? "No messages." : "Nothing here yet — start the conversation."}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {comments.map((c, i) => {
            const sameAuthorAsPrev = i > 0 && comments[i - 1].author_name === c.author_name;
            return (
              <li
                key={c.id}
                className={`group px-3 py-1.5 rounded-md hover:bg-sand/30 ${sameAuthorAsPrev ? "" : "mt-2.5"}`}
              >
                {!sameAuthorAsPrev && (
                  <div className="flex items-baseline gap-2 text-xs mb-0.5">
                    <span className="font-semibold text-ink text-sm">{c.author_name}</span>
                    <span className="text-stone">{timeAgo(c.created_at)}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">{c.body}</p>
                  {isAdmin && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <DeleteCommentButton commentId={c.id} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <div className="bg-card border border-sand rounded-lg p-2.5 space-y-2">
          {!identityName && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={100}
              className="w-44 rounded-md border border-sand bg-paper px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60"
            />
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={onKeyDown}
              rows={Math.min(5, Math.max(1, body.split("\n").length))}
              placeholder={placeholder}
              className="flex-1 resize-none rounded-md border-0 bg-transparent px-1 py-1 text-sm focus:outline-none placeholder:text-stone/60"
            />
            <button
              onClick={() => void send()}
              disabled={pending || !body.trim()}
              className="rounded-md bg-ink text-paper px-3.5 py-1.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {pending ? "…" : "Send"}
            </button>
          </div>
          <p className="text-[0.65rem] text-stone px-1">
            {identityName ? (
              <>Chatting as <span className="font-medium text-ink">{identityName}</span> · Enter to send</>
            ) : (
              <>Enter to send · Shift+Enter for a new line</>
            )}
          </p>
          {error && (
            <p role="alert" className="text-xs text-red-700 px-1">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
