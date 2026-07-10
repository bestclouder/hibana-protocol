"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { aiConfigured, suggestForTicket } from "@/lib/ai-suggest";
import { recomputeClusterStats, type ActionResult } from "@/lib/actions";
import { PILOT_SPACE_ID } from "@/lib/types";

/** Generate suggestions for open, unclustered tickets that lack one. */
export async function scanForSuggestions(): Promise<ActionResult<{ scanned: number }>> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    if (!aiConfigured()) {
      return {
        ok: false,
        message: "AI suggestions aren't configured yet (OPENAI_API_KEY missing). Add it in Vercel env vars.",
      };
    }
    const supabase = createAdminClient();
    const { data: tickets } = await supabase
      .from("struggle_tickets")
      .select("id")
      .is("cluster_id", null)
      .is("cluster_suggestion", null)
      .eq("cluster_suggestion_review_status", "unreviewed")
      .not("status", "in", '("resolved","closed")')
      .order("created_at")
      .limit(10);

    let scanned = 0;
    let lastError: string | undefined;
    for (const t of tickets ?? []) {
      const res = await suggestForTicket(supabase, t.id);
      if (res.stored) scanned++;
      else lastError = res.error;
    }

    await writeAudit(supabase, {
      action: "ai.suggestions_generated",
      target_type: "struggle_ticket",
      actor_email: admin.email,
      metadata: { scanned, of: (tickets ?? []).length },
    });

    revalidatePath("/admin");
    if (scanned === 0 && lastError) return { ok: false, message: lastError };
    return {
      ok: true,
      message: scanned === 0 ? "Nothing new to scan — all open tickets already have a verdict." : `Scanned ${scanned} ticket${scanned === 1 ? "" : "s"}.`,
      data: { scanned },
    };
  } catch (err) {
    console.error("[ai-scan]", err);
    return { ok: false, message: "Scan failed. Please try again." };
  }
}

/** Approve: link to the suggested cluster (creating it first if proposed). */
export async function approveSuggestion(input: { ticketId: string }): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();

    const { data: ticket } = await supabase
      .from("struggle_tickets")
      .select("id, ticket_number, lesson_id, cluster_suggestion, cluster_suggestion_confidence")
      .eq("id", input.ticketId)
      .single();
    if (!ticket?.cluster_suggestion) return { ok: false, message: "No suggestion to approve." };

    let clusterId: string;
    let clusterNumber: string;

    if (ticket.cluster_suggestion.startsWith("NEW: ")) {
      const title = ticket.cluster_suggestion.slice(5);
      const { count } = await supabase
        .from("common_pain_clusters")
        .select("id", { count: "exact", head: true })
        .eq("space_id", PILOT_SPACE_ID);
      clusterNumber = `COMMON-${String((count ?? 0) + 1).padStart(3, "0")}`;
      const { data: created, error } = await supabase
        .from("common_pain_clusters")
        .insert({
          space_id: PILOT_SPACE_ID,
          lesson_id: ticket.lesson_id,
          cluster_number: clusterNumber,
          title,
          summary: `Created from AI suggestion on ${ticket.ticket_number}.`,
          status: "open",
          affected_student_count: 0,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      clusterId = created.id;
    } else {
      const { data: cluster } = await supabase
        .from("common_pain_clusters")
        .select("id, cluster_number")
        .eq("cluster_number", ticket.cluster_suggestion)
        .single();
      if (!cluster) return { ok: false, message: `${ticket.cluster_suggestion} no longer exists.` };
      clusterId = cluster.id;
      clusterNumber = cluster.cluster_number;
    }

    const { error } = await supabase
      .from("struggle_tickets")
      .update({
        cluster_id: clusterId,
        status: "linked_to_cluster",
        cluster_suggestion_review_status: "approved",
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "ai.suggestion_approved",
      target_type: "struggle_ticket",
      target_id: ticket.id,
      actor_email: admin.email,
      metadata: {
        ticket_number: ticket.ticket_number,
        suggestion: ticket.cluster_suggestion,
        confidence: ticket.cluster_suggestion_confidence,
        cluster_number: clusterNumber,
      },
    });
    await recomputeClusterStats(supabase, clusterId);

    revalidatePath("/admin");
    revalidatePath("/admin/clusters");
    revalidatePath("/admin/tickets");
    return { ok: true, message: `${ticket.ticket_number} linked to ${clusterNumber}.` };
  } catch (err) {
    console.error("[ai-approve]", err);
    return { ok: false, message: "Could not approve. Please try again." };
  }
}

export async function rejectSuggestion(input: { ticketId: string }): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();

    const { data: ticket, error } = await supabase
      .from("struggle_tickets")
      .update({ cluster_suggestion_review_status: "rejected" })
      .eq("id", input.ticketId)
      .select("id, ticket_number, cluster_suggestion")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "ai.suggestion_rejected",
      target_type: "struggle_ticket",
      target_id: ticket.id,
      actor_email: admin.email,
      metadata: { ticket_number: ticket.ticket_number, suggestion: ticket.cluster_suggestion },
    });

    revalidatePath("/admin");
    return { ok: true, message: "Suggestion dismissed." };
  } catch (err) {
    console.error("[ai-reject]", err);
    return { ok: false, message: "Could not dismiss. Please try again." };
  }
}
