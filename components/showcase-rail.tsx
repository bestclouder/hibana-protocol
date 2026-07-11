"use client";

import { useEffect, useRef } from "react";

/**
 * Conveyor behavior for the showcase rail: advances one card every 15s
 * using native smooth scrolling (a 4×/minute timer — no animation loop, no
 * re-renders). Hover pauses; any real interaction (touch, wheel, click,
 * keyboard focus) stops it so people can browse freely. Wraps to the start
 * at the end, respects prefers-reduced-motion, idles in hidden tabs.
 */
const ADVANCE_MS = 15000;
const CARD_STEP = 288 + 16; // w-72 card + gap-4

export function ShowcaseRail({ children }: { children: React.ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  const stopped = useRef(false);
  const hovering = useRef(false);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stop = () => {
      stopped.current = true;
    };
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchstart", stop, { passive: true });
    el.addEventListener("pointerdown", stop);
    el.addEventListener("focusin", stop);

    const timer = setInterval(() => {
      if (stopped.current || hovering.current || document.hidden) return;
      const rail = railRef.current;
      if (!rail || rail.scrollWidth <= rail.clientWidth + 8) return;
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
      rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + CARD_STEP, behavior: "smooth" });
    }, ADVANCE_MS);

    return () => {
      clearInterval(timer);
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("focusin", stop);
    };
  }, []);

  return (
    <div
      ref={railRef}
      onMouseEnter={() => {
        hovering.current = true;
      }}
      onMouseLeave={() => {
        hovering.current = false;
      }}
      className="flex gap-4 overflow-x-auto pb-3 snap-x -mx-1 px-1"
    >
      {children}
    </div>
  );
}
