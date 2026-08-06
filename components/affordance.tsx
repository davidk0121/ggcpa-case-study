import {
  Sparkles,
  PenLine,
  User,
  RotateCcw,
  Sigma,
  Check,
  CircleDashed,
  AlertTriangle,
  Lock,
  ChevronRight,
} from "lucide-react";
import type { Provenance, Verification, Affordance } from "@/lib/types";
import { cx } from "@/lib/cx";

/* ------------------------------------------------------------------ *
 * Challenge 08 — one consistent visual language for interaction state *
 * ------------------------------------------------------------------ */

/* --- Provenance: where a value came from --------------------------- */

const PROVENANCE = {
  ai: { label: "AI", Icon: Sparkles, cls: "text-ai bg-ai-soft border-ai-line" },
  human: { label: "You", Icon: PenLine, cls: "text-ink bg-surface-sunken border-line-strong" },
  client: { label: "Client", Icon: User, cls: "text-ink-muted bg-surface-sunken border-line" },
  carryforward: { label: "Prior yr", Icon: RotateCcw, cls: "text-ink-muted bg-surface-sunken border-line" },
  calculated: { label: "Calculated", Icon: Sigma, cls: "text-primary bg-primary-soft border-primary-line" },
} as const satisfies Record<Provenance, { label: string; Icon: typeof Sparkles; cls: string }>;

export function ProvenanceMark({
  provenance,
  size = "sm",
}: {
  provenance: Provenance;
  size?: "sm" | "xs";
}) {
  const { label, Icon, cls } = PROVENANCE[provenance];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-sm border font-medium whitespace-nowrap",
        cls,
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-1 py-px text-[10px]",
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-2.5 w-2.5"} strokeWidth={2} />
      {label}
    </span>
  );
}

/* --- Confidence: only meaningful for AI-produced values ------------ */

export function confidenceTone(value: number) {
  if (value >= 90) return { cls: "text-verified", label: "High" };
  if (value >= 75) return { cls: "text-review", label: "Medium" };
  return { cls: "text-flag", label: "Low" };
}

export function ConfidenceChip({ value }: { value: number }) {
  const tone = confidenceTone(value);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium tnum"
      title={`AI confidence: ${tone.label} (${value}%)`}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", tone.cls, "bg-current")} />
      <span className={tone.cls}>{value}%</span>
    </span>
  );
}

/* --- Verification: the trust state --------------------------------- */

export function VerificationBadge({ verification }: { verification: Verification }) {
  if (verification === "verified")
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-verified-line bg-verified-soft px-1.5 py-0.5 text-[11px] font-medium text-verified">
        <Check className="h-3 w-3" strokeWidth={2.5} />
        Verified
      </span>
    );
  if (verification === "flagged")
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-review-line bg-review-soft px-1.5 py-0.5 text-[11px] font-medium text-review">
        <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
        Needs review
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-subtle">
      <CircleDashed className="h-3 w-3" strokeWidth={2} />
      Unverified
    </span>
  );
}

/* --- Affordance: what you can DO ----------------------------------- */

/** Left-edge accent that signals the row's dominant state at a glance. */
export function accentClass(v: Verification): string {
  if (v === "flagged") return "border-l-2 border-l-review";
  if (v === "verified") return "border-l-2 border-l-verified";
  return "border-l-2 border-l-ai";
}

export function AffordanceHint({ affordance }: { affordance: Affordance }) {
  if (affordance === "editable")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-ink-subtle">
        <PenLine className="h-3 w-3" strokeWidth={2} />
        Editable
      </span>
    );
  if (affordance === "calculated")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-ink-subtle">
        <Sigma className="h-3 w-3" strokeWidth={2} />
        Calculated
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-ink-subtle">
      <Lock className="h-3 w-3" strokeWidth={2} />
      Locked
    </span>
  );
}

/* --- The legend: makes the whole system legible in one place ------- */

export function AffordanceLegend() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] sm:grid-cols-3">
      <LegendRow title="Where it came from">
        <ProvenanceMark provenance="ai" />
        <ProvenanceMark provenance="client" />
        <ProvenanceMark provenance="calculated" />
      </LegendRow>
      <LegendRow title="Trust state">
        <VerificationBadge verification="verified" />
        <VerificationBadge verification="unverified" />
        <VerificationBadge verification="flagged" />
      </LegendRow>
      <LegendRow title="What you can do">
        <AffordanceHint affordance="editable" />
        <AffordanceHint affordance="calculated" />
        <AffordanceHint affordance="readonly" />
      </LegendRow>
    </div>
  );
}

function LegendRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
        {title}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

/** Small right-facing chevron used everywhere a row opens a detail view. */
export function OpensDetail() {
  return <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={2} />;
}
