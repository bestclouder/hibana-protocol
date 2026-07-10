"use client";

import { useRef, useState } from "react";

/**
 * Image field that accepts click-to-browse, drag-and-drop, and clipboard
 * paste (click the box, then ⌘V / Ctrl+V). The chosen file is written into
 * a real <input type="file"> via DataTransfer so plain FormData submission
 * keeps working.
 */
export function ImageInput({
  name,
  hint,
}: {
  name: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function setFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) inputRef.current.files = dt.files;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setLabel(file.name === "image.png" ? "Pasted image" : file.name);
  }

  function clear(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setLabel(null);
  }

  function onPaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (file) {
      e.preventDefault();
      setFile(new File([file], file.name || "pasted-screenshot.png", { type: file.type }));
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setFile(file);
  }

  return (
    <div className="space-y-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          // Some callers render this inside a <label>; stop the label's own
          // activation from opening the file dialog a second time
          e.preventDefault();
          inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onPaste={onPaste}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`w-full rounded-md border border-dashed px-3 py-3 text-sm cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ink/20 ${
          dragOver ? "border-ember bg-ember-wash" : "border-sand bg-card hover:border-stone"
        }`}
      >
        {preview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected image preview" className="h-16 rounded border border-sand" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{label}</p>
              <p className="text-[0.65rem] text-stone">Click to swap · paste (⌘V) to replace</p>
            </div>
            <button
              onClick={clear}
              className="text-xs text-stone hover:text-red-700 underline decoration-sand shrink-0"
            >
              Clear
            </button>
          </div>
        ) : (
          <p className="text-stone text-xs">
            <span className="font-medium text-ink">Click to browse</span>, drag an image in, or
            click here and <span className="font-medium text-ink">paste (⌘V)</span> a screenshot
          </p>
        )}
      </div>
      <input ref={inputRef} type="file" name={name} accept="image/*" className="sr-only" tabIndex={-1} />
      {hint && <p className="text-xs text-stone">{hint}</p>}
    </div>
  );
}
