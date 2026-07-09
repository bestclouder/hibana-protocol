"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteContent, moveContent, type ModerationTarget } from "@/lib/moderation-actions";
import { setThreadFlag } from "@/lib/thread-actions";
import type { Lesson } from "@/lib/types";

/**
 * Organiser-only controls. Rendered exclusively when the server page has
 * verified the session is the admin; every action re-verifies server-side.
 */
export function ModerationBar({
  type,
  id,
  lessons,
  currentLessonId,
  redirectAfterDelete,
}: {
  type: ModerationTarget;
  id: string;
  lessons?: Lesson[];
  currentLessonId?: string | null;
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState(currentLessonId ?? "");

  async function handleDelete() {
    setPending("delete");
    setError(null);
    const res = await deleteContent({ type, id });
    setPending(null);
    setConfirming(false);
    if (res.ok) {
      if (redirectAfterDelete) router.push(redirectAfterDelete);
      router.refresh();
    } else setError(res.message);
  }

  async function handleMove() {
    if (type !== "spark_post" && type !== "struggle_ticket") return;
    setPending("move");
    setError(null);
    const res = await moveContent({ type, id, lessonId: lessonId || null });
    setPending(null);
    if (res.ok) router.refresh();
    else setError(res.message);
  }

  return (
    <div className="border border-gold/30 bg-gold-wash rounded-lg p-3 space-y-2">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold">
        Organiser controls
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {lessons && (
          <>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="rounded-md border border-sand bg-card px-2 py-1.5 text-xs"
            >
              <option value="">No lesson</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleMove}
              disabled={pending !== null}
              className="rounded-md border border-sand bg-card px-3 py-1.5 text-xs font-semibold hover:border-stone disabled:opacity-60"
            >
              {pending === "move" ? "Moving…" : "Move"}
            </button>
          </>
        )}
        <button
          onClick={() => setConfirming(true)}
          disabled={pending !== null}
          className="rounded-md bg-red-700 text-white px-3 py-1.5 text-xs font-semibold hover:bg-red-800 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-card rounded-lg border border-sand shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold">Delete this content?</h3>
            <p className="text-sm text-stone">
              This removes it for everyone, along with its comments and reactions. A snapshot is
              kept in the audit log. This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md border border-sand px-4 py-2 text-sm font-semibold hover:border-stone"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={pending === "delete"}
                className="rounded-md bg-red-700 text-white px-4 py-2 text-sm font-semibold hover:bg-red-800 disabled:opacity-60"
              >
                {pending === "delete" ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact inline delete for admin lists (tickets table, sparks list). */
export function DeleteContentButton({
  type,
  id,
  label,
}: {
  type: ModerationTarget;
  id: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle() {
    if (!window.confirm(`Delete "${label}" for everyone? Its comments and reactions go with it. A snapshot stays in the audit log.`)) return;
    setPending(true);
    const res = await deleteContent({ type, id });
    setPending(false);
    if (res.ok) router.refresh();
    else window.alert(res.message);
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      title="Organiser: delete"
      className="rounded-md border border-red-200 text-red-700 px-2.5 py-1 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle() {
    if (!window.confirm("Delete this comment for everyone?")) return;
    setPending(true);
    const res = await deleteContent({ type: "comment", id: commentId });
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="text-xs text-stone hover:text-red-700 underline decoration-sand disabled:opacity-60"
      title="Organiser: delete comment"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export function ThreadFlagButton({
  threadId,
  flag,
  value,
}: {
  threadId: string;
  flag: "pinned" | "locked";
  value: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    const res = await setThreadFlag({ threadId, flag, value: !value });
    setPending(false);
    if (res.ok) router.refresh();
  }

  const label =
    flag === "pinned" ? (value ? "Unpin" : "Pin") : value ? "Unlock" : "Lock";

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="rounded-md border border-sand bg-card px-3 py-1.5 text-xs font-semibold hover:border-stone disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
