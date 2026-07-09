"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createReflection } from "@/lib/reflection-actions";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

export function ReflectionForm({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confidence, setConfidence] = useState(3);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    setMessage(null);
    const res = await createReflection(formData);
    setPending(false);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) {
      form.reset();
      setConfidence(3);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-sand rounded-lg p-5 space-y-4" noValidate>
      <h3 className="font-display text-lg font-semibold">Reflect on this lesson</h3>
      <input type="hidden" name="lesson_id" value={lessonId} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Main takeaway</span>
        <textarea name="main_takeaway" rows={3} className={inputClasses} placeholder="The one thing that clicked…" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">What was confusing? (optional)</span>
        <textarea name="what_was_confusing" rows={2} className={inputClasses} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">
          Confidence after this lesson: <span className="font-mono">{confidence}/5</span>
        </span>
        <input
          type="range"
          name="confidence_rating"
          min={1}
          max={5}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full accent-ember"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Public comment (optional)</span>
        <input name="public_comment" className={inputClasses} placeholder="Anything to tell the room?" />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Your name</span>
          <input name="author_name" className={inputClasses} maxLength={100} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email (optional)</span>
          <input name="author_email" type="email" className={inputClasses} />
        </label>
      </div>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm rounded-md px-3 py-2 border ${
            message.ok
              ? "text-moss bg-moss-wash border-moss/25"
              : "text-red-700 bg-red-50 border-red-200"
          }`}
        >
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save reflection"}
      </button>
    </form>
  );
}
