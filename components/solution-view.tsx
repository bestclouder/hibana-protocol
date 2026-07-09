"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setResolutionStatus } from "@/lib/resolution-action";
import { fullDate } from "@/lib/format";
import type { CommonPainCluster, StruggleTicket } from "@/lib/types";

/**
 * Shown on the ticket detail page once the organiser posts a solution to the
 * ticket's cluster. The student closes the loop here: Solved or Still stuck.
 */
export function SolutionPanel({
  ticket,
  cluster,
}: {
  ticket: StruggleTicket;
  cluster: CommonPainCluster | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!cluster?.solution_posted_at || !cluster.solution_body) return null;

  async function resolve(status: "solved" | "still_stuck") {
    setPending(status);
    setError(null);
    const res = await setResolutionStatus({ ticketId: ticket.id, status });
    setPending(null);
    if (res.ok) router.refresh();
    else setError(res.message);
  }

  return (
    <section className="bg-ember-wash border border-ember/25 rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-ember">✦</span>
        <h2 className="font-display text-lg font-semibold">A solution has been posted</h2>
      </div>
      <p className="text-xs text-stone">
        Posted {fullDate(cluster.solution_posted_at)} for {cluster.cluster_number}:{" "}
        {cluster.title}
      </p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{cluster.solution_body}</p>
      {ticket.solution_url && (
        <a
          href={ticket.solution_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-medium text-ember-deep underline"
        >
          Open the linked resource →
        </a>
      )}

      {ticket.resolution_status === "solved" ? (
        <p className="text-sm font-medium text-moss bg-moss-wash border border-moss/25 rounded-md px-3 py-2">
          You marked this solved. Glad it&apos;s working!
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Did this fix it for you?</p>
          <div className="flex gap-2">
            <button
              onClick={() => resolve("solved")}
              disabled={pending !== null}
              className="rounded-md bg-moss text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {pending === "solved" ? "Saving…" : "Solved"}
            </button>
            <button
              onClick={() => resolve("still_stuck")}
              disabled={pending !== null}
              className="rounded-md border border-sand bg-card px-4 py-2 text-sm font-semibold hover:border-stone disabled:opacity-60"
            >
              {pending === "still_stuck" ? "Saving…" : "Still stuck"}
            </button>
          </div>
          {ticket.resolution_status === "still_stuck" && (
            <p className="text-xs text-stone">
              You marked this still stuck — the organiser can see that and will follow up.
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
