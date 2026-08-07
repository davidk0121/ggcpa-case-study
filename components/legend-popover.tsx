"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { AffordanceLegend } from "./affordance";

// The field-state legend, reachable from the header on every screen, so the
// vocabulary is always one click away.
export function LegendPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
        aria-expanded={open}
      >
        <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
        Legend
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[420px] rounded-lg border border-line bg-surface p-4 shadow-pop">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-[14px] font-semibold tracking-tight">Interaction legend</h2>
              <p className="text-[12px] text-ink-subtle">
                Every value in Ledgerline is described by three independent axes.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
              aria-label="Close legend"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <AffordanceLegend />
        </div>
      )}
    </div>
  );
}
