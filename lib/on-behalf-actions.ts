"use server";

import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { getLessons } from "@/lib/data";
import { chatJSON, modelChain } from "@/lib/openai";
import type { ActionResult } from "@/lib/actions";

export interface OnBehalfDraft {
  kind: "showcase" | "struggle";
  studentName: string;
  title: string;
  description: string;
  lessonId: string | null;
  notes: string | null;
}

/**
 * Organiser-only: read a chat screenshot (e.g. WhatsApp) and draft a
 * showcase/struggle post in the student's own voice. The screenshot is
 * used for drafting ONLY — it is never stored or published (it may show
 * other students' messages and numbers).
 */
export async function draftFromScreenshot(
  formData: FormData,
): Promise<ActionResult<OnBehalfDraft>> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };

    if (!process.env.OPENAI_API_KEY) {
      return {
        ok: false,
        message: "AI drafting isn't configured yet (OPENAI_API_KEY missing).",
      };
    }

    const file = formData.get("screenshot");
    const hint = String(formData.get("hint") ?? "").trim();
    if (!(file instanceof File) || file.size === 0) {
      if (!hint) return { ok: false, message: "Upload a screenshot (or at least type what happened)." };
    }
    if (file instanceof File && file.size > 6 * 1024 * 1024) {
      return { ok: false, message: "Screenshot is larger than 6 MB — crop or compress it first." };
    }

    const lessons = await getLessons();
    const lessonList = lessons.map((l, i) => `${i}: ${l.title}`).join("\n");

    const system = `You help a course organiser transcribe a student's message (usually a WhatsApp screenshot) into a community post, written AS THE STUDENT in first person.

Decide:
- "kind": "showcase" if the student is sharing something they built/achieved; "struggle" if they're stuck or reporting a problem.
- "student_name": the student's name as it appears in the chat (not the organiser's). If unclear, empty string.
- "title": short, concrete, in the student's voice.
- "description": 1-4 sentences, first person, faithful ONLY to what the student actually wrote — never invent details, errors, or steps they didn't mention. Clean up chat shorthand into plain sentences.
- "lesson_index": the number of the matching lesson from the list, or null if none clearly fits.
- "notes": one short sentence to the ORGANISER about anything ambiguous or worth checking, or null.

LESSONS:
${lessonList || "(none)"}

Respond with JSON only: {"kind":"showcase"|"struggle","student_name":string,"title":string,"description":string,"lesson_index":number|null,"notes":string|null}`;

    const userContent: Array<Record<string, unknown>> = [];
    if (hint) {
      userContent.push({ type: "text", text: `Organiser's note about the context: ${hint}` });
    }
    if (file instanceof File && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "image/png";
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${buf.toString("base64")}` },
      });
    } else {
      userContent.push({ type: "text", text: "(no screenshot provided — draft from the organiser's note alone)" });
    }

    // Cheapest-first: extraction jobs don't need a big model
    const result = await chatJSON({
      models: modelChain(process.env.OPENAI_DRAFT_MODEL ?? process.env.OPENAI_MODEL),
      system,
      user: userContent,
      maxOutputTokens: 900,
    });
    if (!result.ok) return { ok: false, message: result.error };
    const parsed = result.json;

    const lessonIndex = Number(parsed.lesson_index);
    const lessonId =
      Number.isInteger(lessonIndex) && lessons[lessonIndex] ? lessons[lessonIndex].id : null;

    const supabase = await createClient();
    await writeAudit(supabase, {
      action: "ai.on_behalf_drafted",
      target_type: "draft",
      actor_email: admin.email,
      metadata: {
        kind: parsed.kind,
        had_screenshot: file instanceof File && file.size > 0,
        model: result.model,
      },
    });

    return {
      ok: true,
      message: "Draft ready — review it before posting.",
      data: {
        kind: parsed.kind === "showcase" ? "showcase" : "struggle",
        studentName: typeof parsed.student_name === "string" ? parsed.student_name.slice(0, 100) : "",
        title: typeof parsed.title === "string" ? parsed.title.slice(0, 200) : "",
        description: typeof parsed.description === "string" ? parsed.description.slice(0, 2000) : "",
        lessonId,
        notes: typeof parsed.notes === "string" && parsed.notes ? parsed.notes.slice(0, 300) : null,
      },
    };
  } catch (err) {
    console.error("[on-behalf]", err);
    return {
      ok: false,
      message:
        err instanceof Error && err.name === "TimeoutError"
          ? "The AI took too long — try again."
          : "Could not draft from the screenshot. Please try again.",
    };
  }
}
