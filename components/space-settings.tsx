"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateSpace } from "@/lib/space-actions";
import type { CourseSpace } from "@/lib/types";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

export function SpaceSettings({ space }: { space: CourseSpace }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("name") ?? "").trim()) {
      setMessage({ ok: false, text: "The space name is required." });
      return;
    }
    setPending(true);
    setMessage(null);
    const res = await updateSpace(formData);
    setPending(false);
    setMessage({ ok: res.ok, text: res.message });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-sand rounded-lg p-5 space-y-4" noValidate>
      <div>
        <h2 className="font-display text-lg font-semibold">Community space</h2>
        <p className="text-xs text-stone mt-0.5">
          Shown in the header on every page — it&apos;s how students know they&apos;re in the
          right place.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Space name</span>
          <input
            name="name"
            defaultValue={space.name}
            className={inputClasses}
            maxLength={80}
            placeholder="e.g. Hackathon July 2026"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Description (optional)</span>
          <input
            name="description"
            defaultValue={space.description ?? ""}
            className={inputClasses}
            maxLength={300}
          />
        </label>
      </div>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm rounded-md px-3 py-2 border ${
            message.ok ? "text-moss bg-moss-wash border-moss/25" : "text-red-700 bg-red-50 border-red-200"
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
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
