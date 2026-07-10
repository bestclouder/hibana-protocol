"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createLesson, deleteLesson, updateLesson } from "@/lib/lesson-actions";
import type { Lesson } from "@/lib/types";
import { ImageInput } from "@/components/image-input";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

function LessonRow({
  lesson,
  contentCount,
}: {
  lesson: Lesson;
  contentCount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description ?? "");
  const [sortOrder, setSortOrder] = useState(lesson.sort_order);
  const [pending, setPending] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const imageZoneRef = useRef<HTMLDivElement>(null);

  async function save() {
    setPending("save");
    setMessage(null);
    const formData = new FormData();
    formData.set("lesson_id", lesson.id);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("sort_order", String(sortOrder));
    const fileInput = imageZoneRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput?.files?.[0]) formData.set("image", fileInput.files[0]);
    if (removeImage) formData.set("remove_image", "on");
    const res = await updateLesson(formData);
    setPending(null);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) {
      setEditing(false);
      setRemoveImage(false);
      router.refresh();
    }
  }

  async function remove() {
    setPending("delete");
    setMessage(null);
    const res = await deleteLesson({ id: lesson.id });
    setPending(null);
    setConfirming(false);
    if (res.ok) router.refresh();
    else setMessage({ ok: false, text: res.message });
  }

  return (
    <li className="bg-card border border-sand rounded-lg p-4 space-y-3">
      {editing ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            <label className="block space-y-1 w-20">
              <span className="text-xs font-medium text-stone">Order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className={inputClasses}
              />
            </label>
            <label className="block space-y-1 flex-1">
              <span className="text-xs font-medium text-stone">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClasses} maxLength={200} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClasses}
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-stone">Explainer image</span>
            {lesson.image_url && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lesson.image_url} alt="Current lesson image" className="h-14 rounded border border-sand" />
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={removeImage}
                    onChange={(e) => setRemoveImage(e.target.checked)}
                    className="size-4 accent-ink"
                  />
                  Remove image
                </label>
              </div>
            )}
            <div ref={imageZoneRef}>
              <ImageInput name="image" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={pending !== null}
              className="rounded-md bg-ink text-paper px-4 py-1.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {pending === "save" ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setTitle(lesson.title);
                setDescription(lesson.description ?? "");
                setSortOrder(lesson.sort_order);
              }}
              className="rounded-md border border-sand px-4 py-1.5 text-sm font-semibold hover:border-stone"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <span className="font-mono text-xs text-stone mt-1 w-6">{lesson.sort_order}.</span>
          {lesson.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lesson.image_url} alt="" className="h-12 w-16 object-cover rounded border border-sand shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{lesson.title}</p>
            {lesson.description && (
              <p className="text-xs text-stone mt-0.5 line-clamp-2">{lesson.description}</p>
            )}
            <p className="text-xs text-stone mt-1">{contentCount} posts tagged</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-sand bg-card px-3 py-1.5 text-xs font-semibold hover:border-stone"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirming(true)}
              disabled={pending !== null}
              className="rounded-md border border-red-200 text-red-700 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-xs ${message.ok ? "text-moss" : "text-red-700"}`}
        >
          {message.text}
        </p>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-card rounded-lg border border-sand shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold">Delete “{lesson.title}”?</h3>
            <p className="text-sm text-stone">
              {contentCount > 0
                ? `${contentCount} posts are tagged with this lesson. They won't be deleted — they'll move to "No lesson".`
                : "Nothing is tagged with this lesson."}{" "}
              This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md border border-sand px-4 py-2 text-sm font-semibold hover:border-stone"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                disabled={pending === "delete"}
                className="rounded-md bg-red-700 text-white px-4 py-2 text-sm font-semibold hover:bg-red-800 disabled:opacity-60"
              >
                {pending === "delete" ? "Deleting…" : "Delete lesson"}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export function LessonManager({
  lessons,
  contentCounts,
}: {
  lessons: Lesson[];
  contentCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (!String(formData.get("title") ?? "").trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await createLesson(formData);
    setPending(false);
    if (res.ok) {
      form.reset();
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <ul className="space-y-2">
        {lessons.map((l) => (
          <LessonRow key={l.id} lesson={l} contentCount={contentCounts[l.id] ?? 0} />
        ))}
        {lessons.length === 0 && (
          <li className="text-sm text-stone border border-dashed border-sand rounded-lg p-10 text-center">
            No lessons yet — add the first one.
          </li>
        )}
      </ul>

      <form onSubmit={handleAdd} className="bg-card border border-sand rounded-lg p-5 space-y-4" noValidate>
        <h2 className="font-display text-lg font-semibold">Add a lesson</h2>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Title</span>
          <input name="title" className={inputClasses} placeholder="e.g. Lesson 5: Shipping your agent" maxLength={200} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Description</span>
          <textarea name="description" rows={3} className={inputClasses} />
        </label>
        <div className="space-y-1.5">
          <span className="block text-sm font-medium">Explainer image (optional)</span>
          <ImageInput name="image" hint="A screenshot or diagram that helps explain the lesson." />
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
          {pending ? "Adding…" : "Add lesson"}
        </button>
      </form>
    </div>
  );
}
