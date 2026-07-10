import type { SupabaseClient } from "@supabase/supabase-js";
import { chatJSON, modelChain } from "@/lib/openai";

/**
 * AI cluster suggestion (docs/INTELLIGENCE_LAYER.md). Sends a struggle
 * ticket plus the open clusters and unclustered peers to OpenAI and gets
 * back a match + confidence. Advisory only — nothing is linked until the
 * organiser approves (docs/AGENTIC_LAYER.md). Server-side only.
 */

export interface SuggestionResult {
  /** COMMON-### of an existing cluster, or null */
  match: string | null;
  /** proposed title when several tickets share a new, unclustered issue */
  newClusterTitle: string | null;
  confidence: number;
  reason: string;
  /** which model actually answered (cheapest-first fallback chain) */
  model: string;
}

interface TicketInput {
  ticket_number: string;
  title: string;
  description: string | null;
  lessonTitle?: string | null;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateClusterSuggestion(input: {
  ticket: TicketInput;
  clusters: { cluster_number: string; title: string; summary: string | null }[];
  peers: TicketInput[];
}): Promise<SuggestionResult | { error: string }> {
  const system = `You triage struggle tickets for an online course community. Students report blockers; the organiser groups tickets describing the SAME underlying issue into "common pain" clusters so one solution can fix many.

Decide whether the NEW ticket belongs to an existing cluster, matches other unclustered tickets (making a new cluster worthwhile), or stands alone.

Rules:
- "match": the cluster number (e.g. "COMMON-001") ONLY if the new ticket describes the same underlying problem as that cluster. Different wording is fine; different problem is not. Otherwise null.
- "new_cluster_title": ONLY if match is null AND at least one peer ticket clearly shares the same underlying issue — a short organiser-friendly title for that shared issue. Otherwise null.
- "confidence": 0 to 1, how sure you are of your primary call.
- "reason": one plain sentence the organiser will read.

Respond with JSON only: {"match": string|null, "new_cluster_title": string|null, "confidence": number, "reason": string}`;

  const describe = (t: TicketInput) =>
    `[${t.ticket_number}] ${t.title}${t.lessonTitle ? ` (lesson: ${t.lessonTitle})` : ""}${t.description ? ` — ${t.description.slice(0, 400)}` : ""}`;

  const user = `EXISTING CLUSTERS:
${
    input.clusters.length > 0
      ? input.clusters
          .map((c) => `${c.cluster_number}: ${c.title}${c.summary ? ` — ${c.summary.slice(0, 300)}` : ""}`)
          .join("\n")
      : "(none yet)"
  }

OTHER OPEN UNCLUSTERED TICKETS:
${input.peers.length > 0 ? input.peers.map(describe).join("\n") : "(none)"}

NEW TICKET:
${describe(input.ticket)}`;

  const result = await chatJSON({
    models: modelChain(process.env.OPENAI_MODEL),
    system,
    user,
    maxOutputTokens: 600,
  });
  if (!result.ok) return { error: result.error };
  const parsed = result.json;
  const confidence = Number(parsed.confidence);
  return {
    match: typeof parsed.match === "string" && /^COMMON-\d+$/.test(parsed.match) ? parsed.match : null,
    newClusterTitle:
      typeof parsed.new_cluster_title === "string" && parsed.new_cluster_title.trim()
        ? parsed.new_cluster_title.trim().slice(0, 200)
        : null,
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
    reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : "",
    model: result.model,
  };
}

/**
 * Generate and store a suggestion for one ticket. Best-effort: failures are
 * recorded to the console, never thrown at the student.
 */
export async function suggestForTicket(
  supabase: Pick<SupabaseClient, "from">,
  ticketId: string,
): Promise<{ stored: boolean; error?: string }> {
  const { data: ticket } = await supabase
    .from("struggle_tickets")
    .select("id, ticket_number, title, description, lesson_id, cluster_id, status")
    .eq("id", ticketId)
    .single();
  if (!ticket || ticket.cluster_id) return { stored: false, error: "Ticket missing or already clustered." };

  const [{ data: clusters }, { data: peers }, { data: lessons }] = await Promise.all([
    supabase
      .from("common_pain_clusters")
      .select("cluster_number, title, summary")
      .order("created_at"),
    supabase
      .from("struggle_tickets")
      .select("ticket_number, title, description, lesson_id")
      .is("cluster_id", null)
      .neq("id", ticketId)
      .not("status", "in", '("resolved","closed")')
      .order("created_at", { ascending: false })
      .limit(15),
    supabase.from("lessons").select("id, title"),
  ]);
  const lessonTitle = (id: string | null) =>
    id ? (lessons ?? []).find((l) => l.id === id)?.title ?? null : null;

  const result = await generateClusterSuggestion({
    ticket: { ...ticket, lessonTitle: lessonTitle(ticket.lesson_id) },
    clusters: clusters ?? [],
    peers: (peers ?? []).map((p) => ({ ...p, lessonTitle: lessonTitle(p.lesson_id) })),
  });
  if ("error" in result) {
    // Leave the ticket scannable, but make the failure visible to the
    // organiser (and in the DB) instead of vanishing
    console.error(`[ai-suggest] ${ticket.ticket_number}:`, result.error);
    await supabase
      .from("struggle_tickets")
      .update({ cluster_suggestion_reason: `Last attempt failed: ${result.error}` })
      .eq("id", ticketId);
    return { stored: false, error: result.error };
  }

  const suggestion = result.match ?? (result.newClusterTitle ? `NEW: ${result.newClusterTitle}` : null);
  await supabase
    .from("struggle_tickets")
    .update({
      cluster_suggestion: suggestion,
      cluster_suggestion_source: `openai/${result.model}`,
      cluster_suggestion_confidence: result.confidence,
      cluster_suggestion_reason: result.reason,
      cluster_suggestion_review_status: suggestion ? "unreviewed" : "no_match",
    })
    .eq("id", ticketId);
  return { stored: true };
}
