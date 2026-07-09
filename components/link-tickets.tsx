"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { linkTicketsToCluster, unlinkTicket } from "@/lib/admin-actions";
import type { StruggleTicket } from "@/lib/types";

/** Multi-select panel on the cluster detail page for linking open tickets. */
export function LinkTicketsPanel({
  clusterId,
  candidates,
}: {
  clusterId: string;
  candidates: StruggleTicket[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function link() {
    setPending(true);
    setMessage(null);
    const res = await linkTicketsToCluster({ clusterId, ticketIds: [...selected] });
    setPending(false);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) {
      setSelected(new Set());
      router.refresh();
    }
  }

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-stone">
        No unlinked tickets right now — every reported struggle is already in a cluster.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {candidates.map((t) => (
          <li key={t.id}>
            <label className="flex items-center gap-3 bg-card border border-sand rounded-md px-3 py-2.5 cursor-pointer hover:border-stone transition-colors">
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggle(t.id)}
                className="size-4 accent-ink"
              />
              <span className="font-mono text-xs text-dusk-deep">{t.ticket_number}</span>
              <span className="text-sm flex-1 truncate">{t.title}</span>
              <span className="text-xs text-stone whitespace-nowrap">{t.author_name}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <button
          onClick={link}
          disabled={pending || selected.size === 0}
          className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? "Linking…"
            : `Link ${selected.size || ""} ticket${selected.size === 1 ? "" : "s"}`}
        </button>
        {message && (
          <p role="status" className={`text-sm ${message.ok ? "text-moss" : "text-red-700"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

export function UnlinkButton({ ticketId, clusterId }: { ticketId: string; clusterId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    const res = await unlinkTicket({ ticketId, clusterId });
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="text-xs text-stone hover:text-red-700 underline decoration-sand disabled:opacity-60"
    >
      {pending ? "Unlinking…" : "Unlink"}
    </button>
  );
}
