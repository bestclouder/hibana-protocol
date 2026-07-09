"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCluster } from "@/lib/admin-actions";
import type { Lesson } from "@/lib/types";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

export function ClusterForm({ lessons }: { lessons: Lesson[] }) {
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
    const res = await createCluster(formData);
    setPending(false);
    if (res.ok && res.data) {
      form.reset();
      router.push(`/admin/clusters/${res.data.id}`);
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-sand rounded-lg p-5 space-y-4"
      noValidate
    >
      <h2 className="font-display text-lg font-semibold">New Common Pain cluster</h2>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          className={inputClasses}
          placeholder="e.g. API key connection fails in Lesson 3"
          maxLength={200}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Summary</span>
        <textarea
          name="summary"
          rows={3}
          className={inputClasses}
          placeholder="What do the linked tickets have in common?"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Lesson</span>
        <select name="lesson_id" className={inputClasses} defaultValue="">
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create cluster"}
      </button>
    </form>
  );
}
