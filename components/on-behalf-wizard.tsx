"use client";

import Link from "next/link";
import { useState } from "react";
import { createSpark, createStruggle } from "@/lib/actions";
import { draftFromScreenshot, type OnBehalfDraft } from "@/lib/on-behalf-actions";
import type { Lesson } from "@/lib/types";
import { ImageInput } from "@/components/image-input";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

export function OnBehalfWizard({ lessons }: { lessons: Lesson[] }) {
  const [draft, setDraft] = useState<OnBehalfDraft | null>(null);
  const [pending, setPending] = useState<"draft" | "post" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<{ href: string; label: string } | null>(null);

  async function handleDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending("draft");
    setError(null);
    const res = await draftFromScreenshot(new FormData(e.currentTarget));
    setPending(null);
    if (res.ok && res.data) setDraft(res.data);
    else setError(res.message);
  }

  async function handlePost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("title") ?? "").trim() || !String(formData.get("author_name") ?? "").trim()) {
      setError("Title and the student's name are required.");
      return;
    }
    setPending("post");
    setError(null);
    const kind = String(formData.get("kind"));
    const res = kind === "showcase" ? await createSpark(formData) : await createStruggle(formData);
    setPending(null);
    if (res.ok && res.data) {
      setPosted({
        href: kind === "showcase" ? `/sparks/${res.data.id}` : `/tickets/${res.data.id}`,
        label: res.message,
      });
      setDraft(null);
    } else {
      setError(res.message);
    }
  }

  if (posted) {
    return (
      <div className="bg-moss-wash border border-moss/25 rounded-lg p-6 text-center space-y-3">
        <p className="text-sm font-medium text-moss">{posted.label}</p>
        <div className="flex justify-center gap-3">
          <Link href={posted.href} className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90">
            View the post
          </Link>
          <button
            onClick={() => setPosted(null)}
            className="rounded-md border border-sand bg-card px-4 py-2 text-sm font-semibold hover:border-stone"
          >
            Post another
          </button>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <form onSubmit={handleDraft} className="bg-card border border-sand rounded-lg p-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <span className="block text-sm font-medium">Chat screenshot</span>
          <ImageInput
            name="screenshot"
            hint="Used only to write the draft — it is never uploaded to the site or shown to anyone."
          />
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Extra context (optional)</span>
          <textarea
            name="hint"
            rows={2}
            className={inputClasses}
            placeholder="e.g. this is Maria from the Tuesday cohort, she's on lesson 2"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending !== null}
          className="rounded-md bg-ember text-white px-5 py-2.5 text-sm font-semibold hover:bg-ember-deep disabled:opacity-60"
        >
          {pending === "draft" ? "Reading the screenshot…" : "Draft the post"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePost} className="bg-card border border-sand rounded-lg p-6 space-y-4" noValidate>
      {draft.notes && (
        <p className="text-sm text-gold bg-gold-wash border border-gold/30 rounded-md px-3 py-2">
          <span className="font-medium">Check:</span> {draft.notes}
        </p>
      )}
      <div className="flex gap-4">
        {(["showcase", "struggle"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="radio" name="kind" value={k} defaultChecked={draft.kind === k} className="accent-ink" />
            {k === "showcase" ? "✦ Showcase" : "Struggle ticket"}
          </label>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Student&apos;s name</span>
          <input name="author_name" defaultValue={draft.studentName} className={inputClasses} maxLength={100} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Student&apos;s email (optional)</span>
          <input name="author_email" type="email" className={inputClasses} placeholder="For solution notifications" />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Title</span>
        <input name="title" defaultValue={draft.title} className={inputClasses} maxLength={200} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Post (in the student&apos;s voice)</span>
        <textarea name="description" rows={5} defaultValue={draft.description} className={inputClasses} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Lesson</span>
        <select name="lesson_id" defaultValue={draft.lessonId ?? ""} className={inputClasses}>
          <option value="">No specific lesson</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending !== null}
          className="rounded-md bg-ink text-paper px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {pending === "post" ? "Posting…" : "Post as this student"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(null);
            setError(null);
          }}
          className="rounded-md border border-sand px-5 py-2.5 text-sm font-semibold hover:border-stone"
        >
          Start over
        </button>
      </div>
    </form>
  );
}
