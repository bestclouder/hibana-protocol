"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionResult } from "@/lib/actions";
import type { Lesson } from "@/lib/types";

export interface SimilarIssue {
  id: string;
  ticketNumber: string;
  title: string;
  lessonId: string | null;
}

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-stone placeholder:text-stone/60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-stone">{hint}</span>}
    </label>
  );
}

/**
 * Shared Spark / Struggle submission form. All states covered: inline
 * validation, loading spinner, success message, server error.
 */
export function SubmitForm({
  kind,
  lessons,
  action,
  identityName,
  isAdmin = false,
  identityEmail,
  openIssues,
}: {
  kind: "spark" | "struggle";
  lessons: Lesson[];
  action: (formData: FormData) => Promise<ActionResult<{ id: string; ticketNumber?: string }>>;
  /** Signed-in display name; hides name/email fields and posts as this user. */
  identityName?: string | null;
  /** Organiser mode: author fields stay visible and editable (attribution). */
  isAdmin?: boolean;
  identityEmail?: string | null;
  /** Open struggles shown as "is it one of these?" when a lesson is picked. */
  openIssues?: SimilarIssue[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult<{ id: string; ticketNumber?: string }> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState("");

  const similar = (openIssues ?? []).filter(
    (i) => !selectedLesson || i.lessonId === selectedLesson,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!String(formData.get("title") ?? "").trim()) {
      setValidationError("Title is required.");
      return;
    }
    if (!identityName && !isAdmin && !String(formData.get("author_name") ?? "").trim()) {
      setValidationError("Your name is required.");
      return;
    }
    setValidationError(null);
    setPending(true);
    setResult(null);
    try {
      const res = await action(formData);
      setResult(res);
      if (res.ok) {
        form.reset();
        const detailPath =
          res.data?.id && (kind === "struggle" ? `/tickets/${res.data.id}` : `/sparks/${res.data.id}`);
        setTimeout(() => {
          if (detailPath) router.push(detailPath);
          else router.push("/feed");
          router.refresh();
        }, 1600);
      }
    } catch {
      setResult({ ok: false, message: "Could not save. Please try again." });
    } finally {
      setPending(false);
    }
  }

  const accent = kind === "spark" ? "bg-ember hover:bg-ember-deep" : "bg-dusk hover:bg-dusk-deep";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Title">
        <input
          name="title"
          className={inputClasses}
          placeholder={kind === "spark" ? "What did you pull off?" : "What are you stuck on?"}
          maxLength={200}
        />
      </Field>
      <Field
        label="Description"
        hint={
          kind === "struggle"
            ? "What did you try? What error do you see? The more detail, the faster the fix."
            : "Tell the room how you did it — someone is stuck exactly where you started."
        }
      >
        <textarea name="description" rows={5} className={inputClasses} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Lesson">
          <select
            name="lesson_id"
            className={inputClasses}
            defaultValue=""
            onChange={(e) => setSelectedLesson(e.target.value)}
          >
            <option value="">No specific lesson</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Screenshot (optional)">
          <input type="file" name="image" accept="image/*" className={`${inputClasses} file:mr-3 file:border-0 file:bg-sand file:rounded file:px-2 file:py-1 file:text-xs`} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Image URL (optional)" hint="Alternative to uploading a file.">
          <input name="image_url" type="url" className={inputClasses} placeholder="https://…" />
        </Field>
        {kind === "spark" && (
          <Field label="Link (optional)" hint="A demo, template, or write-up to share.">
            <input name="external_link" type="url" className={inputClasses} placeholder="https://…" />
          </Field>
        )}
      </div>
      {isAdmin ? (
        <div className="space-y-2">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold">
            Organiser: attribute this post
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Author name" hint="Yours by default — change it to post on a student's behalf.">
              <input name="author_name" defaultValue={identityName ?? ""} className={inputClasses} maxLength={100} />
            </Field>
            <Field
              label="Author email (optional)"
              hint={kind === "struggle" ? "Solution notifications go to this address." : undefined}
            >
              <input name="author_email" type="email" defaultValue={identityEmail ?? ""} className={inputClasses} />
            </Field>
          </div>
        </div>
      ) : identityName ? (
        <p className="text-sm text-stone">
          Posting as <span className="font-medium text-ink">{identityName}</span>
          {kind === "struggle" && " — we'll email you when a solution is posted for your ticket."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Your name">
            <input name="author_name" className={inputClasses} maxLength={100} />
          </Field>
          <Field
            label="Your email (optional)"
            hint={kind === "struggle" ? "We'll email you when a solution is posted for your ticket." : undefined}
          >
            <input name="author_email" type="email" className={inputClasses} />
          </Field>
        </div>
      )}

      {kind === "struggle" && similar.length > 0 && (
        <div className="bg-dusk-wash border border-dusk/20 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Already reported? Join the conversation instead:</p>
          <ul className="space-y-1">
            {similar.slice(0, 5).map((i) => (
              <li key={i.id}>
                <Link
                  href={`/tickets/${i.id}`}
                  className="inline-flex items-center gap-2 text-sm text-dusk-deep hover:underline"
                >
                  <span className="font-mono text-xs">{i.ticketNumber}</span>
                  <span className="truncate">{i.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone">
            Open the matching ticket, tap <em>I have this too</em>, and chat there — the organiser
            sees how many people are stuck, and you&apos;ll be part of that solution.
          </p>
        </div>
      )}

      {validationError && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {validationError}
        </p>
      )}
      {result && !result.ok && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {result.message}
        </p>
      )}
      {result?.ok && (
        <p role="status" className="text-sm text-moss bg-moss-wash border border-moss/25 rounded-md px-3 py-2">
          {result.message} Taking you there…
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-md text-white px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${accent}`}
      >
        {pending && (
          <span
            aria-hidden
            className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
          />
        )}
        {pending
          ? "Saving…"
          : kind === "spark"
            ? "Post Spark"
            : "Create ticket"}
      </button>
    </form>
  );
}
