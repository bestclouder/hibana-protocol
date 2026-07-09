"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postSolution, sendSolutionEmails } from "@/lib/solution-actions";
import { fullDate } from "@/lib/format";
import type { CommonPainCluster } from "@/lib/types";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

/**
 * Solution panel on the cluster detail page. Two explicit steps
 * (docs/AGENTIC_LAYER.md): save the solution, then notify students — the
 * send only fires after the admin confirms the recipient count in a dialog.
 */
export function SolutionEditor({
  cluster,
  recipientCount,
}: {
  cluster: CommonPainCluster;
  recipientCount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!cluster.solution_posted_at);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sendingState, setSendingState] = useState<"idle" | "sending">("idle");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveSolution(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("solution_body") ?? "").trim()) {
      setMessage({ ok: false, text: "Solution cannot be empty" });
      return;
    }
    setMessage(null);
    setPending(true);
    const res = await postSolution(formData);
    setPending(false);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function notify() {
    setConfirming(false);
    setSendingState("sending");
    setMessage(null);
    const res = await sendSolutionEmails({ clusterId: cluster.id });
    setSendingState("idle");
    setMessage({ ok: res.ok, text: res.message });
    router.refresh();
  }

  return (
    <div className="bg-card border border-sand rounded-lg p-5 space-y-4 relative">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Solution</h2>
        {cluster.solution_posted_at && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-stone hover:text-ink underline decoration-sand"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={saveSolution} className="space-y-3" noValidate>
          <input type="hidden" name="cluster_id" value={cluster.id} />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">What should affected students do?</span>
            <textarea
              name="solution_body"
              rows={7}
              defaultValue={cluster.solution_body ?? ""}
              className={inputClasses}
              placeholder="Write the fix step by step. This exact text is emailed to every affected student."
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Link (optional)</span>
            <input
              name="solution_url"
              type="url"
              className={inputClasses}
              placeholder="https:// — a video walkthrough, doc, or updated lesson"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-ember text-white px-4 py-2 text-sm font-semibold hover:bg-ember-deep disabled:opacity-60"
          >
            {pending ? "Saving…" : "Post Solution"}
          </button>
        </form>
      ) : cluster.solution_body ? (
        <div className="space-y-4">
          <p className="text-xs text-stone">
            Posted {cluster.solution_posted_at && fullDate(cluster.solution_posted_at)}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap bg-ember-wash border border-ember/20 rounded-md p-4">
            {cluster.solution_body}
          </p>
          <button
            onClick={() => setConfirming(true)}
            disabled={sendingState === "sending"}
            className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {sendingState === "sending" ? "Sending…" : "Notify Students"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-stone">No solution yet.</p>
      )}

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm rounded-md px-3 py-2 border ${
            message.ok
              ? "text-moss bg-moss-wash border-moss/25"
              : "text-red-700 bg-red-50 border-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notify-dialog-title"
        >
          <div className="bg-card rounded-lg border border-sand shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 id="notify-dialog-title" className="font-display text-lg font-semibold">
              Email {recipientCount} student{recipientCount === 1 ? "" : "s"}?
            </h3>
            <p className="text-sm text-stone">
              Every author of a linked ticket who left an email will receive the solution for{" "}
              <span className="font-medium text-ink">{cluster.cluster_number}</span> with a link
              back to their ticket. This sends real email — it can&apos;t be unsent.
            </p>
            {recipientCount === 0 && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                No linked ticket has an author email, so nobody would receive this.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md border border-sand px-4 py-2 text-sm font-semibold hover:border-stone"
              >
                Cancel
              </button>
              <button
                onClick={notify}
                disabled={recipientCount === 0}
                className="rounded-md bg-ember text-white px-4 py-2 text-sm font-semibold hover:bg-ember-deep disabled:opacity-50"
              >
                Confirm &amp; send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
