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
  GitPullRequestArrow,
} from "lucide-react";
import type { Provenance, Verification, Affordance } from "@/lib/types";
import { cx } from "@/lib/cx";

// Shared badges and marks for a field's state, reused across every screen so
// the same value reads the same way wherever it appears.

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
  if (verification === "awaiting_approval")
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-primary bg-primary px-1.5 py-0.5 text-[11px] font-medium text-surface">
        <GitPullRequestArrow className="h-3 w-3" strokeWidth={2.5} />
        Approval needed
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
  if (v === "awaiting_approval") return "border-l-2 border-l-primary";
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

// Spells out the three axes and what each badge means, so a new user doesn't
// have to infer the system from the UI.
export function AffordanceLegend() {
  return (
    <div className="space-y-4">
      <LegendAxis
        title="Provenance"
        caption="Where the value came from"
        rows={[
          [<ProvenanceMark key="a" provenance="ai" />, "Extracted or derived by the model"],
          [<ProvenanceMark key="b" provenance="client" />, "Supplied by the client"],
          [<ProvenanceMark key="c" provenance="human" />, "Typed or confirmed by firm staff"],
          [<ProvenanceMark key="d" provenance="carryforward" />, "Pulled from the prior-year return"],
          [<ProvenanceMark key="e" provenance="calculated" />, "Computed from other lines"],
        ]}
      />
      <LegendAxis
        title="Trust state"
        caption="How much to rely on it"
        rows={[
          [<VerificationBadge key="a" verification="verified" />, "A human confirmed it"],
          [<VerificationBadge key="b" verification="unverified" />, "No one has checked it yet"],
          [
            <VerificationBadge key="c" verification="awaiting_approval" />,
            "AI proposes a change — nothing moves until you approve",
          ],
          [<VerificationBadge key="d" verification="flagged" />, "There is a specific problem to resolve"],
        ]}
      />
      <LegendAxis
        title="Affordance"
        caption="What you can do with it"
        rows={[
          [<AffordanceHint key="a" affordance="editable" />, "Change it directly"],
          [<AffordanceHint key="b" affordance="calculated" />, "Edit its inputs instead"],
          [<AffordanceHint key="c" affordance="readonly" />, "Locked — the reason is always shown"],
        ]}
      />
      <p className="border-t border-line pt-3 text-[12px] text-ink-subtle">
        The three axes are independent. An AI-extracted figure a reviewer confirmed is{" "}
        <span className="font-medium text-ink-muted">AI + editable + verified</span>; a statutory
        amount is <span className="font-medium text-ink-muted">prior-year + locked + verified</span>.
      </p>
    </div>
  );
}

function LegendAxis({
  title,
  caption,
  rows,
}: {
  title: string;
  caption: string;
  rows: Array<[React.ReactNode, string]>;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink">{title}</span>
        <span className="text-[11px] text-ink-subtle">{caption}</span>
      </div>
      <ul className="space-y-1">
        {rows.map(([mark, meaning], i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span className="flex w-[132px] shrink-0 justify-start">{mark}</span>
            <span className="text-[12px] text-ink-muted">{meaning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small right-facing chevron used everywhere a row opens a detail view. */
export function OpensDetail() {
  return <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={2} />;
}
