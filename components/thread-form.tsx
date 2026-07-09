"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createThread } from "@/lib/thread-actions";
import type { Lesson } from "@/lib/types";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

export function ThreadForm({ lessons }: { lessons: Lesson[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (!String(formData.get("title") ?? "").trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await createThread(formData);
    setPending(false);
    if (res.ok && res.data) {
      form.reset();
      router.push(`/threads/${res.data.id}`);
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-gold/30 rounded-lg p-5 space-y-4" noValidate>
      <div>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold">
          Organiser only
        </p>
        <h2 className="font-display text-lg font-semibold">Start a targeted conversation</h2>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Title</span>
        <input name="title" className={inputClasses} placeholder="e.g. Live Q&A prep: what should we cover?" maxLength={200} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Opening post</span>
        <textarea name="body" rows={4} className={inputClasses} placeholder="Frame the conversation — what do you want students to weigh in on?" />
      </label>
      <div className="flex items-center gap-4">
        <label className="block space-y-1.5 flex-1">
          <span className="text-sm font-medium">Lesson (optional)</span>
          <select name="lesson_id" className={inputClasses} defaultValue="">
            <option value="">Whole cohort</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium pt-5">
          <input type="checkbox" name="pinned" className="size-4 accent-ink" />
          Pin to top
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create thread"}
      </button>
    </form>
  );
}
