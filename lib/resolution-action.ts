"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { recomputeClusterStats, type ActionResult } from "@/lib/actions";

/** Student closes the loop on their ticket: Solved or Still stuck. */
export async function setResolutionStatus(input: {
  ticketId: string;
  status: "solved" | "still_stuck";
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: ticket, error } = await supabase
      .from("struggle_tickets")
      .update({
        resolution_status: input.status,
        status: input.status === "solved" ? "resolved" : "still_stuck",
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", input.ticketId)
      .select("id, ticket_number, cluster_id, author_email")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "ticket.resolution_status",
      target_type: "struggle_ticket",
      target_id: ticket.id,
      actor_email: ticket.author_email,
      metadata: { ticket_number: ticket.ticket_number, resolution_status: input.status },
    });

    if (ticket.cluster_id) await recomputeClusterStats(supabase, ticket.cluster_id);

    revalidatePath(`/tickets/${input.ticketId}`);
    revalidatePath("/feed");
    revalidatePath("/admin");
    return { ok: true, message: "Thanks for closing the loop." };
  } catch (err) {
    console.error("[resolution]", err);
    return { ok: false, message: "Could not save. Please try again." };
  }
}
