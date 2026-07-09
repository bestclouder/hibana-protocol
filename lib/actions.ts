"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIdentity } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { PILOT_SPACE_ID, type ReactionType, type TargetType } from "@/lib/types";

export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function required(value: FormDataEntryValue | null, label: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) throw new ValidationError(`${label} is required.`);
  return s;
}

class ValidationError extends Error {}

function optional(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s || null;
}

/**
 * Try to upload an attached image to Supabase Storage. Storage isn't
 * provisioned in the pilot (no bucket, anon key can't create one), so a
 * failure is non-fatal: the post is saved without the image and the caller
 * surfaces a note — never a silent failure.
 */
async function tryUploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: FormDataEntryValue | null,
): Promise<{ url: string | null; note: string | null }> {
  if (!(file instanceof File) || file.size === 0) return { url: null, note: null };
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, note: "Image skipped: larger than 5 MB." };
  }
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("images").upload(path, file);
  if (error) {
    return {
      url: null,
      note: "Image skipped: file storage isn't set up yet. You can paste an image URL instead.",
    };
  }
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return { url: data.publicUrl, note: null };
}

/** Next sequential number for HIB-### / COMMON-### tags (count + 1, per docs). */
async function nextNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "struggle_tickets" | "common_pain_clusters",
  prefix: string,
): Promise<string> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("space_id", PILOT_SPACE_ID);
  if (error) throw new Error(error.message);
  return `${prefix}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

// ─── Sprint 2: Sparks, Struggles, reactions, comments ────────────────────────

export async function createSpark(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const identity = await getIdentity();
    const title = required(formData.get("title"), "Title");
    // Signed-in users post as themselves; the session identity wins over
    // whatever the form says. Anonymous posting stays allowed. The organiser
    // is the one exception: they may attribute a post to someone else
    // (e.g. reposting a win a student shared in chat).
    const authorName =
      identity.isAdmin && optional(formData.get("author_name"))
        ? optional(formData.get("author_name"))!
        : identity.user
          ? identity.name!
          : required(formData.get("author_name"), "Your name");
    const authorEmail = identity.isAdmin
      ? optional(formData.get("author_email"))
      : identity.user
        ? identity.email
        : optional(formData.get("author_email"));
    const upload = await tryUploadImage(supabase, formData.get("image"));

    const { data, error } = await supabase
      .from("spark_posts")
      .insert({
        space_id: PILOT_SPACE_ID,
        lesson_id: optional(formData.get("lesson_id")),
        user_id: identity.user?.id ?? null,
        author_name: authorName,
        author_email: authorEmail,
        title,
        description: optional(formData.get("description")),
        image_url: upload.url ?? optional(formData.get("image_url")),
        external_link: optional(formData.get("external_link")),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "spark.created",
      target_type: "spark_post",
      target_id: data.id,
      actor_email: authorEmail,
      metadata: { title },
    });

    revalidatePath("/feed");
    const note = upload.note ? ` (${upload.note})` : "";
    return { ok: true, message: `Your Spark has been posted!${note}`, data: { id: data.id } };
  } catch (err) {
    return failure(err, "Could not save. Please try again.");
  }
}

export async function createStruggle(
  formData: FormData,
): Promise<ActionResult<{ id: string; ticketNumber: string }>> {
  try {
    const supabase = await createClient();
    const identity = await getIdentity();
    const title = required(formData.get("title"), "Title");
    const authorName =
      identity.isAdmin && optional(formData.get("author_name"))
        ? optional(formData.get("author_name"))!
        : identity.user
          ? identity.name!
          : required(formData.get("author_name"), "Your name");
    const authorEmail = identity.isAdmin
      ? optional(formData.get("author_email"))
      : identity.user
        ? identity.email
        : optional(formData.get("author_email"));
    const upload = await tryUploadImage(supabase, formData.get("image"));

    // count+1 numbering per docs/INTELLIGENCE_LAYER.md; retry on the unique
    // constraint in case two students submit at the same moment
    let ticketNumber = await nextNumber(supabase, "struggle_tickets", "HIB");
    let inserted: { id: string } | null = null;
    for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
      const { data, error } = await supabase
        .from("struggle_tickets")
        .insert({
          space_id: PILOT_SPACE_ID,
          lesson_id: optional(formData.get("lesson_id")),
          user_id: identity.user?.id ?? null,
          ticket_number: ticketNumber,
          author_name: authorName,
          author_email: authorEmail,
          title,
          description: optional(formData.get("description")),
          image_url: upload.url ?? optional(formData.get("image_url")),
          status: "open",
        })
        .select("id")
        .single();
      if (data) inserted = data;
      else if (error?.code === "23505") {
        const n = parseInt(ticketNumber.split("-")[1], 10) + 1;
        ticketNumber = `HIB-${String(n).padStart(3, "0")}`;
      } else if (error) throw new Error(error.message);
    }
    if (!inserted) throw new Error("Could not assign a ticket number.");

    await writeAudit(supabase, {
      action: "ticket.created",
      target_type: "struggle_ticket",
      target_id: inserted.id,
      actor_email: authorEmail,
      metadata: { title, ticket_number: ticketNumber, lesson_id: optional(formData.get("lesson_id")) },
    });

    revalidatePath("/feed");
    const note = upload.note ? ` (${upload.note})` : "";
    return {
      ok: true,
      message: `Your ticket ${ticketNumber} has been created.${note}`,
      data: { id: inserted.id, ticketNumber },
    };
  } catch (err) {
    return failure(err, "Could not save. Please try again.");
  }
}

export async function addReaction(input: {
  targetId: string;
  targetType: TargetType;
  reactionType: ReactionType;
  reactorName?: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const identity = await getIdentity();
    const { error } = await supabase.from("reactions").insert({
      target_id: input.targetId,
      target_type: input.targetType,
      reaction_type: input.reactionType,
      user_id: identity.user?.id ?? null,
      reactor_name: identity.name ?? input.reactorName ?? "Anonymous student",
      reactor_email: identity.email,
    });
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: `reaction.${input.reactionType}`,
      target_type: input.targetType,
      target_id: input.targetId,
    });

    // affected_student_count feeds off i_have_this_too (docs/INTELLIGENCE_LAYER.md)
    if (input.targetType === "struggle_ticket" && input.reactionType === "i_have_this_too") {
      const { data: ticket } = await supabase
        .from("struggle_tickets")
        .select("cluster_id")
        .eq("id", input.targetId)
        .single();
      if (ticket?.cluster_id) await recomputeClusterStats(supabase, ticket.cluster_id);
    }

    revalidatePath("/feed");
    revalidatePath(`/tickets/${input.targetId}`);
    revalidatePath(`/sparks/${input.targetId}`);
    return { ok: true, message: "Reaction added" };
  } catch (err) {
    return failure(err, "Could not save your reaction. Please try again.");
  }
}

export async function addComment(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const identity = await getIdentity();
    const body = required(formData.get("body"), "Comment");
    const authorName = identity.user
      ? identity.name!
      : required(formData.get("author_name"), "Your name");
    const targetId = required(formData.get("target_id"), "Target");
    const targetType = required(formData.get("target_type"), "Target type");

    // Locked threads take no new replies
    if (targetType === "thread") {
      const { data: thread } = await supabase
        .from("threads")
        .select("locked")
        .eq("id", targetId)
        .single();
      if (thread?.locked) {
        return { ok: false, message: "This thread is locked — no new replies." };
      }
    }

    const { error } = await supabase.from("comments").insert({
      target_id: targetId,
      target_type: targetType,
      user_id: identity.user?.id ?? null,
      author_name: authorName,
      author_email: identity.user ? identity.email : optional(formData.get("author_email")),
      body,
    });
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "comment.created",
      target_type: targetType,
      target_id: targetId,
      actor_email: identity.email ?? optional(formData.get("author_email")),
    });

    revalidatePath(`/tickets/${targetId}`);
    revalidatePath(`/sparks/${targetId}`);
    revalidatePath(`/threads/${targetId}`);
    return { ok: true, message: "Comment posted" };
  } catch (err) {
    return failure(err, "Could not post your comment. Please try again.");
  }
}

// ─── Shared: cluster stats (docs/INTELLIGENCE_LAYER.md) ───────────────────────

export async function recomputeClusterStats(
  supabase: Pick<Awaited<ReturnType<typeof createClient>>, "from">,
  clusterId: string,
) {
  const { data: tickets } = await supabase
    .from("struggle_tickets")
    .select("id, resolution_status")
    .eq("cluster_id", clusterId);
  const linked = tickets ?? [];
  let reactionCount = 0;
  if (linked.length > 0) {
    const { count } = await supabase
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .in("target_id", linked.map((t) => t.id))
      .eq("reaction_type", "i_have_this_too");
    reactionCount = count ?? 0;
  }
  const resolved = linked.filter((t) => t.resolution_status === "solved").length;
  // Cluster writes are service-role-only after the 0002 lockdown, and this
  // recompute also runs inside student actions (reactions, resolutions)
  await createAdminClient()
    .from("common_pain_clusters")
    .update({
      affected_student_count: linked.length + reactionCount,
      resolution_rate: linked.length > 0 ? Math.round((resolved / linked.length) * 100) : null,
    })
    .eq("id", clusterId);
}

function failure(err: unknown, fallback: string): { ok: false; message: string } {
  if (err instanceof ValidationError) return { ok: false, message: err.message };
  console.error("[action]", err);
  return { ok: false, message: fallback };
}
