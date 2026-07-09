"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { sendEmail, solutionEmailHtml } from "@/lib/email";
import type { ActionResult } from "@/lib/actions";

/**
 * Approved tool: post a solution to a Common Pain cluster
 * (docs/AGENTIC_LAYER.md — admin action, always audit-logged).
 */
export async function postSolution(formData: FormData): Promise<ActionResult> {
  try {
    if (!(await requireAdmin())) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();
    const clusterId = String(formData.get("cluster_id") ?? "");
    const solutionBody = String(formData.get("solution_body") ?? "").trim();
    const solutionUrl = String(formData.get("solution_url") ?? "").trim() || null;
    if (!solutionBody) return { ok: false, message: "Solution cannot be empty" };

    const { data: cluster, error } = await supabase
      .from("common_pain_clusters")
      .update({
        solution_body: solutionBody,
        solution_posted_at: new Date().toISOString(),
        status: "solution_posted",
      })
      .eq("id", clusterId)
      .select("id, cluster_number")
      .single();
    if (error) throw new Error(error.message);

    // Cascade to linked tickets: they now have a posted solution
    await supabase
      .from("struggle_tickets")
      .update({
        status: "solution_posted",
        solution_url: solutionUrl,
        last_updated_at: new Date().toISOString(),
      })
      .eq("cluster_id", clusterId)
      .not("status", "in", '("resolved","closed")');

    await writeAudit(supabase, {
      action: "cluster.solution_posted",
      target_type: "common_pain_cluster",
      target_id: cluster.id,
      metadata: { cluster_number: cluster.cluster_number, has_link: Boolean(solutionUrl) },
    });

    revalidatePath(`/admin/clusters/${clusterId}`);
    revalidatePath("/admin");
    revalidatePath("/feed");
    return { ok: true, message: "Solution saved. Now notify the affected students." };
  } catch (err) {
    console.error("[solution]", err);
    return { ok: false, message: "Could not save the solution. Please try again." };
  }
}

/**
 * Approved tool: send_solution_email (docs/AGENTIC_LAYER.md — high risk,
 * only runs after the admin confirms the recipient count in the dialog).
 * Every attempt writes an email_notifications row; the batch writes one
 * audit_logs entry. Failures are reported to the admin, never swallowed.
 */
export async function sendSolutionEmails(input: {
  clusterId: string;
}): Promise<ActionResult<{ sent: number; failed: number }>> {
  try {
    if (!(await requireAdmin())) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();
    const { data: cluster } = await supabase
      .from("common_pain_clusters")
      .select("*")
      .eq("id", input.clusterId)
      .single();
    if (!cluster) return { ok: false, message: "Cluster not found." };
    if (!cluster.solution_body || !cluster.solution_posted_at) {
      return { ok: false, message: "Post a solution before notifying students." };
    }

    const { data: tickets } = await supabase
      .from("struggle_tickets")
      .select("id, ticket_number, title, author_name, author_email")
      .eq("cluster_id", input.clusterId)
      .not("author_email", "is", null);

    const recipients = tickets ?? [];
    if (recipients.length === 0) {
      return {
        ok: false,
        message: "No linked ticket has an author email — there is no one to notify.",
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    let sent = 0;
    let failed = 0;
    let lastError: string | null = null;

    for (const t of recipients) {
      const result = await sendEmail({
        to: t.author_email!,
        subject: `A solution has been posted for your issue [${t.ticket_number}]`,
        html: solutionEmailHtml({
          recipientName: t.author_name,
          ticketNumber: t.ticket_number,
          ticketTitle: t.title,
          clusterTitle: cluster.title,
          solutionBody: cluster.solution_body,
          ticketUrl: `${appUrl}/tickets/${t.id}`,
        }),
      });
      if (result.ok) sent++;
      else {
        failed++;
        lastError = result.error;
      }
      await supabase.from("email_notifications").insert({
        cluster_id: cluster.id,
        ticket_id: t.id,
        recipient_email: t.author_email!,
        recipient_name: t.author_name,
        email_type: "solution_posted",
        status: result.ok ? "sent" : "failed",
        sent_at: result.ok ? new Date().toISOString() : null,
      });
    }

    await writeAudit(supabase, {
      action: "email.solution_notification_sent",
      target_type: "common_pain_cluster",
      target_id: cluster.id,
      metadata: {
        cluster_number: cluster.cluster_number,
        recipient_count: recipients.length,
        sent,
        failed,
      },
    });

    revalidatePath(`/admin/clusters/${input.clusterId}`);

    if (failed > 0) {
      return {
        ok: false,
        message: `${sent} sent, ${failed} failed.${lastError ? ` Last error: ${lastError}` : ""}`,
      };
    }
    return {
      ok: true,
      message: `Notified ${sent} student${sent === 1 ? "" : "s"}.`,
      data: { sent, failed },
    };
  } catch (err) {
    console.error("[notify]", err);
    return { ok: false, message: "Could not send notifications. Please try again." };
  }
}
