"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { PILOT_SPACE_ID } from "@/lib/types";
import type { ActionResult } from "@/lib/actions";

export async function createReflection(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const lessonId = String(formData.get("lesson_id") ?? "").trim();
    const authorName = String(formData.get("author_name") ?? "").trim();
    const mainTakeaway = String(formData.get("main_takeaway") ?? "").trim();
    if (!lessonId) return { ok: false, message: "Pick the lesson you're reflecting on." };
    if (!authorName) return { ok: false, message: "Your name is required." };
    if (!mainTakeaway) return { ok: false, message: "Share at least your main takeaway." };

    const rating = parseInt(String(formData.get("confidence_rating") ?? ""), 10);

    const { data, error } = await supabase
      .from("lesson_reflections")
      .insert({
        space_id: PILOT_SPACE_ID,
        lesson_id: lessonId,
        author_name: authorName,
        author_email: String(formData.get("author_email") ?? "").trim() || null,
        main_takeaway: mainTakeaway,
        what_was_confusing: String(formData.get("what_was_confusing") ?? "").trim() || null,
        confidence_rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null,
        public_comment: String(formData.get("public_comment") ?? "").trim() || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "reflection.created",
      target_type: "lesson_reflection",
      target_id: data.id,
      metadata: { lesson_id: lessonId },
    });

    revalidatePath(`/lessons/${lessonId}`);
    return { ok: true, message: "Reflection saved — thanks for closing out the lesson." };
  } catch (err) {
    console.error("[reflection]", err);
    return { ok: false, message: "Could not save. Please try again." };
  }
}
