"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateSparkPost } from "@/lib/actions";
import type { Lesson, SparkPost } from "@/lib/types";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

/**
 * The showcase post body. Owners (signed in) and the organiser get an Edit
 * button that swaps the content for a prefilled form.
 */
export function ShowcaseContent({
  spark,
  lessons,
  canEdit,
}: {
  spark: SparkPost;
  lessons: Lesson[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("title") ?? "").trim()) {
      setMessage({ ok: false, text: "Title is required." });
      return;
    }
    setPending(true);
    setMessage(null);
    const res = await updateSparkPost(formData);
    setPending(false);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        {(spark.description || spark.image_url || spark.external_link) && (
          <div className="bg-card border border-sand rounded-lg p-5 space-y-4">
            {spark.description && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{spark.description}</p>
            )}
            {spark.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={spark.image_url}
                alt="Attached image"
                className="rounded-md border border-sand max-w-full"
              />
            )}
            {spark.external_link && (
              <a
                href={spark.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium text-ember-deep underline"
              >
                Check it out →
              </a>
            )}
          </div>
        )}
        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-sand bg-card px-3.5 py-1.5 text-xs font-semibold hover:border-stone transition-colors"
            >
              ✏️ Edit post
            </button>
            {message?.ok && (
              <p role="status" className="text-xs text-moss">
                {message.text}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-card border border-sand rounded-lg p-5 space-y-4" noValidate>
      <input type="hidden" name="spark_id" value={spark.id} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Title</span>
        <input name="title" defaultValue={spark.title} className={inputClasses} maxLength={200} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Description</span>
        <textarea name="description" rows={5} defaultValue={spark.description ?? ""} className={inputClasses} />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Lesson</span>
          <select name="lesson_id" defaultValue={spark.lesson_id ?? ""} className={inputClasses}>
            <option value="">No specific lesson</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Link (optional)</span>
          <input
            name="external_link"
            type="url"
            defaultValue={spark.external_link ?? ""}
            className={inputClasses}
            placeholder="https://…"
          />
        </label>
      </div>

      <fieldset className="space-y-2 border border-sand rounded-md p-3">
        <legend className="text-sm font-medium px-1">Image</legend>
        {spark.image_url ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spark.image_url} alt="Current image" className="h-16 rounded border border-sand" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_image" className="size-4 accent-ink" />
              Remove current image
            </label>
          </div>
        ) : (
          <p className="text-xs text-stone">No image on this post yet.</p>
        )}
        <label className="block space-y-1.5">
          <span className="text-xs text-stone">Upload a replacement</span>
          <input
            type="file"
            name="image"
            accept="image/*"
            className={`${inputClasses} file:mr-3 file:border-0 file:bg-sand file:rounded file:px-2 file:py-1 file:text-xs`}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-stone">…or paste an image URL</span>
          <input name="image_url" type="url" className={inputClasses} placeholder="https://…" />
        </label>
      </fieldset>

      {message && !message.ok && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {message.text}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setMessage(null);
          }}
          className="rounded-md border border-sand px-4 py-2 text-sm font-semibold hover:border-stone"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
