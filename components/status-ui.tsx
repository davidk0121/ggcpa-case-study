import { Check } from "lucide-react";
import type { ReturnStage } from "@/lib/types";
import { STAGES, stageMeta } from "@/lib/status";
import { cx } from "@/lib/cx";

const TONE: Record<string, string> = {
  waiting: "border-review-line bg-review-soft text-review",
  active: "border-primary-line bg-primary-soft text-primary",
  done: "border-verified-line bg-verified-soft text-verified",
  neutral: "border-line bg-surface-sunken text-ink-muted",
};

export function StageBadge({
  stage,
  audience = "firm",
}: {
  stage: ReturnStage;
  audience?: "firm" | "client";
}) {
  const m = stageMeta(stage);
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE[m.tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {audience === "client" ? m.clientLabel : m.label}
    </span>
  );
}

/**
 * The shared 6-step mental model. Same steps for everyone; labels and the
 * "what's next" copy adapt to the audience so a client never sees firm jargon.
 */
export function StageTracker({
  stage,
  audience = "firm",
}: {
  stage: ReturnStage;
  audience?: "firm" | "client";
}) {
  const current = stageMeta(stage).step;
  return (
    <ol className="flex items-center">
      {STAGES.map((s, i) => {
        const state =
          s.step < current ? "done" : s.step === current ? "current" : "future";
        return (
          <li key={s.stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cx(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold tnum",
                  state === "done" && "border-verified bg-verified text-surface",
                  state === "current" && "border-primary bg-primary text-surface",
                  state === "future" && "border-line bg-surface text-ink-subtle",
                )}
              >
                {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.step}
              </div>
              <span
                className={cx(
                  "max-w-[76px] text-center text-[10.5px] leading-tight",
                  state === "future" ? "text-ink-subtle" : "font-medium text-ink",
                )}
              >
                {audience === "client" ? s.clientLabel : s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cx(
                  "mx-1 h-px flex-1",
                  s.step < current ? "bg-verified" : "bg-line",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
