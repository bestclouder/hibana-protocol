"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { recomputeClusterStats, type ActionResult } from "@/lib/actions";
import { PILOT_SPACE_ID } from "@/lib/types";

// ─── Sprint 3: Common Pain clusters ───────────────────────────────────────────

export async function createCluster(
  formData: FormData,
): Promise<ActionResult<{ id: string; clusterNumber: string }>> {
  try {
    if (!(await requireAdmin())) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { ok: false, message: "Title is required." };

    const { count } = await supabase
      .from("common_pain_clusters")
      .select("id", { count: "exact", head: true })
      .eq("space_id", PILOT_SPACE_ID);
    let clusterNumber = `COMMON-${String((count ?? 0) + 1).padStart(3, "0")}`;

    let inserted: { id: string } | null = null;
    for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
      const { data, error } = await supabase
        .from("common_pain_clusters")
        .insert({
          space_id: PILOT_SPACE_ID,
          lesson_id: String(formData.get("lesson_id") ?? "").trim() || null,
          cluster_number: clusterNumber,
          title,
          summary: String(formData.get("summary") ?? "").trim() || null,
          status: "open",
          affected_student_count: 0,
        })
        .select("id")
        .single();
      if (data) inserted = data;
      else if (error?.code === "23505") {
        const n = parseInt(clusterNumber.split("-")[1], 10) + 1;
        clusterNumber = `COMMON-${String(n).padStart(3, "0")}`;
      } else if (error) throw new Error(error.message);
    }
    if (!inserted) throw new Error("Could not assign a cluster number.");

    await writeAudit(supabase, {
      action: "cluster.created",
      target_type: "common_pain_cluster",
      target_id: inserted.id,
      metadata: { title, cluster_number: clusterNumber },
    });

    revalidatePath("/admin/clusters");
    revalidatePath("/admin");
    return {
      ok: true,
      message: `Cluster ${clusterNumber} created.`,
      data: { id: inserted.id, clusterNumber },
    };
  } catch (err) {
    console.error("[admin]", err);
    return { ok: false, message: "Could not create the cluster. Please try again." };
  }
}

export async function linkTicketsToCluster(input: {
  clusterId: string;
  ticketIds: string[];
}): Promise<ActionResult> {
  try {
    if (!(await requireAdmin())) return { ok: false, message: NOT_ADMIN_MESSAGE };
    if (input.ticketIds.length === 0)
      return { ok: false, message: "Select at least one ticket to link." };
    const supabase = createAdminClient();

    const { data: cluster } = await supabase
      .from("common_pain_clusters")
      .select("id, cluster_number")
      .eq("id", input.clusterId)
      .single();
    if (!cluster) return { ok: false, message: "Cluster not found." };

    const { error } = await supabase
      .from("struggle_tickets")
      .update({
        cluster_id: input.clusterId,
        status: "linked_to_cluster",
        last_updated_at: new Date().toISOString(),
      })
      .in("id", input.ticketIds);
    if (error) throw new Error(error.message);

    for (const ticketId of input.ticketIds) {
      await writeAudit(supabase, {
        action: "cluster.ticket_linked",
        target_type: "struggle_ticket",
        target_id: ticketId,
        metadata: { cluster_id: input.clusterId, cluster_number: cluster.cluster_number },
      });
    }
    await recomputeClusterStats(supabase, input.clusterId);

    revalidatePath(`/admin/clusters/${input.clusterId}`);
    revalidatePath("/admin/clusters");
    revalidatePath("/admin/tickets");
    revalidatePath("/feed");
    return {
      ok: true,
      message: `Linked ${input.ticketIds.length} ticket${input.ticketIds.length === 1 ? "" : "s"} to ${cluster.cluster_number}.`,
    };
  } catch (err) {
    console.error("[admin]", err);
    return { ok: false, message: "Could not link tickets. Please try again." };
  }
}

export async function unlinkTicket(input: { ticketId: string; clusterId: string }): Promise<ActionResult> {
  try {
    if (!(await requireAdmin())) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("struggle_tickets")
      .update({ cluster_id: null, status: "open", last_updated_at: new Date().toISOString() })
      .eq("id", input.ticketId);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "cluster.ticket_unlinked",
      target_type: "struggle_ticket",
      target_id: input.ticketId,
      metadata: { cluster_id: input.clusterId },
    });
    await recomputeClusterStats(supabase, input.clusterId);

    revalidatePath(`/admin/clusters/${input.clusterId}`);
    revalidatePath("/admin/tickets");
    return { ok: true, message: "Ticket unlinked." };
  } catch (err) {
    console.error("[admin]", err);
    return { ok: false, message: "Could not unlink the ticket. Please try again." };
  }
}

// ─── Sprint 6: featured sparks ────────────────────────────────────────────────

export async function toggleFeatured(input: { sparkId: string; featured: boolean }): Promise<ActionResult> {
  try {
    if (!(await requireAdmin())) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("spark_posts")
      .update({ featured: input.featured })
      .eq("id", input.sparkId);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: input.featured ? "spark.featured" : "spark.unfeatured",
      target_type: "spark_post",
      target_id: input.sparkId,
    });

    revalidatePath("/feed");
    revalidatePath("/admin");
    return { ok: true, message: input.featured ? "Featured in the showcase." : "Unfeatured." };
  } catch (err) {
    console.error("[admin]", err);
    return { ok: false, message: "Could not update. Please try again." };
  }
}
