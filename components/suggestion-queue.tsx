"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { approveSuggestion, rejectSuggestion, scanForSuggestions } from "@/lib/suggestion-actions";
import { TicketTag } from "@/components/badges";

export interface QueuedSuggestion {
  ticketId: string;
  ticketNumber: string;
  ticketTitle: string;
  suggestion: string;
  confidence: number | null;
  reason: string | null;
}

export function SuggestionQueue({
  suggestions,
  scannableCount,
  aiConfigured,
}: {
  suggestions: QueuedSuggestion[];
  scannableCount: number;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(key: string, fn: () => Promise<{ ok: boolean; message: string }>) {
    setPending(key);
    setMessage(null);
    const res = await fn();
    setPending(null);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) router.refresh();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-lg font-semibold">
          AI cluster suggestions{" "}
          <span className="text-stone font-sans text-sm font-normal">
            — you approve, nothing links itself
          </span>
        </h2>
        <button
          onClick={() => run("scan", scanForSuggestions)}
          disabled={pending !== null || !aiConfigured || scannableCount === 0}
          title={!aiConfigured ? "Add OPENAI_API_KEY in Vercel env vars to enable" : undefined}
          className="rounded-md border border-sand bg-card px-3.5 py-1.5 text-sm font-semibold hover:border-stone disabled:opacity-50"
        >
          {pending === "scan"
            ? "Scanning…"
            : `Scan ${scannableCount} unclustered ticket${scannableCount === 1 ? "" : "s"}`}
        </button>
      </div>

      {!aiConfigured && (
        <p className="text-sm text-stone bg-gold-wash border border-gold/30 rounded-md px-3 py-2">
          AI suggestions are off — add <code className="font-mono text-xs">OPENAI_API_KEY</code> to
          the Vercel env vars and redeploy to enable them.
        </p>
      )}

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm rounded-md px-3 py-2 border ${
            message.ok ? "text-moss bg-moss-wash border-moss/25" : "text-red-700 bg-red-50 border-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      {suggestions.length === 0 ? (
        <p className="text-sm text-stone border border-dashed border-sand rounded-lg p-6 text-center">
          No suggestions waiting for review.
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s) => (
            <li key={s.ticketId} className="bg-card border border-sand rounded-lg px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <TicketTag number={s.ticketNumber} />
                <Link
                  href={`/tickets/${s.ticketId}`}
                  className="text-sm font-medium hover:text-dusk-deep flex-1 truncate"
                >
                  {s.ticketTitle}
                </Link>
                <span className="text-sm">
                  →{" "}
                  <span className="font-mono text-xs font-semibold text-gold">
                    {s.suggestion.startsWith("NEW: ") ? `new cluster “${s.suggestion.slice(5)}”` : s.suggestion}
                  </span>
                </span>
                {s.confidence !== null && (
                  <span className="font-mono text-xs text-stone">{Math.round(s.confidence * 100)}%</span>
                )}
              </div>
              {s.reason && <p className="text-xs text-stone">{s.reason}</p>}
              <div className="flex gap-2 pt-0.5">
                <button
                  onClick={() => run(`a-${s.ticketId}`, () => approveSuggestion({ ticketId: s.ticketId }))}
                  disabled={pending !== null}
                  className="rounded-md bg-moss text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {pending === `a-${s.ticketId}` ? "Linking…" : "Approve & link"}
                </button>
                <button
                  onClick={() => run(`r-${s.ticketId}`, () => rejectSuggestion({ ticketId: s.ticketId }))}
                  disabled={pending !== null}
                  className="rounded-md border border-sand px-3 py-1.5 text-xs font-semibold hover:border-stone disabled:opacity-60"
                >
                  {pending === `r-${s.ticketId}` ? "…" : "Dismiss"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
