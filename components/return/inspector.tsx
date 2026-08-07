"use client";

import { useState } from "react";
import {
  Check,
  Flag,
  Send,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowRight,
  Info,
  PenLine,
  GitPullRequestArrow,
  History,
  X,
} from "lucide-react";
import type { ReturnField } from "@/lib/types";
import { documentsById } from "@/lib/data";
import { computeReturn, derivationFor } from "@/lib/compute";
import { currency } from "@/lib/format";
import { cx } from "@/lib/cx";
import {
  ProvenanceMark,
  ConfidenceChip,
  VerificationBadge,
  AffordanceHint,
  confidenceTone,
} from "@/components/affordance";
import { DocumentView } from "./document-view";
import { reanalyzeField, type AiReanalysis } from "@/lib/mockAI";

export interface InspectorActions {
  onVerify: (id: string) => void;
  onFlag: (id: string) => void;
  onRequestClient: (id: string) => void;
  onEdit: (id: string, value: number, reason: string) => void;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function Inspector({
  field,
  allFields,
  audience,
  actions,
}: {
  field: ReturnField;
  /** Live (override-aware, recomputed) fields, never read the base fixtures. */
  allFields: ReturnField[];
  audience: "firm" | "client";
  actions: InspectorActions;
}) {
  return (
    <div className="flex h-full flex-col">
      <InspectorHeader field={field} audience={audience} />
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        {/* An approval request outranks everything else, so it goes first. */}
        {field.verification === "awaiting_approval" && audience === "firm" && (
          <ApprovalPanel field={field} actions={actions} />
        )}

        {field.affordance === "calculated" && field.inputs && (
          <FormulaBlock field={field} allFields={allFields} onSelect={actions.onSelect} />
        )}

        {/* A derived line with no source docs is fully explained by its
            derivation, so repeating it under "Source" would just be noise. */}
        {!(field.affordance === "calculated" && field.inputs && field.sources.length === 0) && (
          <Traceability field={field} />
        )}

        {field.ai && audience === "firm" && <AiPanel field={field} />}

        {audience === "firm" && <CorrectionPanel field={field} actions={actions} />}

        {audience === "firm" && field.history && field.history.length > 0 && (
          <HistoryPanel field={field} />
        )}

        {audience === "client" && <ClientNote field={field} />}
      </div>
    </div>
  );
}

/* ---------------------------- header ---------------------------- */
// In client view the header drops the firm-only state (confidence, provenance,
// approval). This has to be gated here too, not only in the field list.
function InspectorHeader({
  field,
  audience,
}: {
  field: ReturnField;
  audience: "firm" | "client";
}) {
  return (
    <div className="border-b border-line px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
        {field.formLine}
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-tight">{field.label}</h2>
        <span className="text-[20px] font-semibold tnum">{currency(field.value)}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {audience === "firm" ? (
          <>
            <ProvenanceMark provenance={field.provenance} />
            <VerificationBadge verification={field.verification} />
            <AffordanceHint affordance={field.affordance} />
            {field.ai && <ConfidenceChip value={field.ai.confidence} />}
          </>
        ) : (
          <ClientStateBadge verification={field.verification} />
        )}
      </div>
    </div>
  );
}

function ClientStateBadge({ verification }: { verification: ReturnField["verification"] }) {
  if (verification === "verified")
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-verified-line bg-verified-soft px-1.5 py-0.5 text-[11px] font-medium text-verified">
        <Check className="h-3 w-3" strokeWidth={2.5} />
        Reviewed by your preparer
      </span>
    );
  if (verification === "flagged")
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-review-line bg-review-soft px-1.5 py-0.5 text-[11px] font-medium text-review">
        <Flag className="h-3 w-3" strokeWidth={2.5} />
        We have a question
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-sm border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-subtle">
      In progress
    </span>
  );
}

/* ------------------- approval ----------------------------------- */
// The AI has proposed a change; the live value stays put until someone approves
// or rejects. Approving recomputes the downstream totals right away.
function ApprovalPanel({
  field,
  actions,
}: {
  field: ReturnField;
  actions: InspectorActions;
}) {
  const delta = (field.proposedValue ?? 0) - (field.value ?? 0);
  return (
    <section className="rounded-lg border-2 border-primary bg-primary-soft/40 p-3.5">
      <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-primary">
        <GitPullRequestArrow className="h-3.5 w-3.5" strokeWidth={2.5} />
        AI proposes a change — your approval required
      </h3>

      <div className="mb-3 flex items-center gap-3 rounded-md border border-primary-line bg-surface px-3 py-2.5">
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-ink-subtle">Current</div>
          <div className="text-[16px] font-semibold tnum text-ink-muted line-through decoration-ink-subtle/50">
            {currency(field.value)}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={2} />
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-primary">Proposed</div>
          <div className="text-[16px] font-semibold tnum text-primary">
            {currency(field.proposedValue ?? null)}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10.5px] uppercase tracking-wide text-ink-subtle">Impact</div>
          <div className={cx("text-[13px] font-semibold tnum", delta < 0 ? "text-flag" : "text-verified")}>
            {delta > 0 ? "+" : ""}
            {currency(delta)}
          </div>
        </div>
      </div>

      {field.proposalReason && (
        <p className="mb-3 text-[12.5px] text-ink">{field.proposalReason}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => actions.onApprove(field.id)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-surface hover:bg-primary-strong"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Approve change
        </button>
        <button
          onClick={() => actions.onReject(field.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          Keep current value
        </button>
        <button
          onClick={() => actions.onRequestClient(field.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
          Ask the client first
        </button>
      </div>
    </section>
  );
}

/* ------------------- audit trail --------------------------------- */
function HistoryPanel({ field }: { field: ReturnField }) {
  return (
    <Section title="Audit trail" icon={<History className="h-3.5 w-3.5" />}>
      <ol className="space-y-2">
        {field.history!.map((h, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-subtle" />
            <div className="min-w-0">
              <div className="text-[12.5px]">
                <span className="font-medium">{h.actor}</span>{" "}
                <span className="text-ink-muted">{h.action}</span>
              </div>
              <div className="text-[11px] text-ink-subtle">
                {new Date(h.at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {h.note ? ` · ${h.note}` : ""}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------- calculated → formula ----------------------- */
function FormulaBlock({
  field,
  allFields,
  onSelect,
}: {
  field: ReturnField;
  allFields: ReturnField[];
  onSelect: (id: string) => void;
}) {
  // Derive from the LIVE values so an override or approved change is reflected
  // here immediately, not from the base fixtures.
  const values = Object.fromEntries(allFields.map((f) => [f.id, f.value]));
  const { breakdown } = computeReturn(values);
  const deriv = derivationFor(field.id, values, breakdown);

  return (
    <Section title="How this is calculated" icon={<Sparkles className="h-3.5 w-3.5" />}>
      {field.transformation && (
        <p className="mb-2 text-[13px] text-ink-muted">{field.transformation}</p>
      )}

      {deriv ? (
        <table className="w-full text-[12.5px]">
          <tbody>
            {deriv.rows.map((r, i) => (
              <tr key={i}>
                <td className="w-5 py-0.5 align-baseline font-mono text-ink-subtle">{r.op}</td>
                <td className="py-0.5 align-baseline">
                  {r.fieldId ? (
                    <button
                      onClick={() => onSelect(r.fieldId!)}
                      className="group inline-flex items-center gap-1 text-left text-ink-muted hover:text-primary hover:underline"
                    >
                      {r.label}
                      <ArrowUpRight
                        className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
                        strokeWidth={2}
                      />
                    </button>
                  ) : (
                    <span className={r.subtotal ? "text-ink-subtle italic" : "text-ink-muted"}>
                      {r.label}
                    </span>
                  )}
                </td>
                <td
                  className={cx(
                    "py-0.5 pl-3 text-right align-baseline tnum",
                    r.subtotal ? "text-ink-subtle" : "text-ink",
                  )}
                >
                  {currency(r.value)}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="pt-1">
                <div className="border-t border-line-strong" />
              </td>
            </tr>
            <tr>
              <td className="w-5 py-1 align-baseline font-mono text-primary">{deriv.result.op}</td>
              <td className="py-1 align-baseline font-semibold text-ink">{deriv.result.label}</td>
              <td className="py-1 pl-3 text-right align-baseline font-semibold text-primary tnum">
                {currency(deriv.result.value)}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="text-[12.5px] text-ink-subtle">
          Derived by the system. See the source documents below.
        </p>
      )}
    </Section>
  );
}

/* ------------------- traceability ------------------------------- */
function Traceability({ field }: { field: ReturnField }) {
  if (field.sources.length === 0) {
    return (
      <Section title="Source" icon={<Info className="h-3.5 w-3.5" />}>
        <p className="text-[13px] text-ink-muted">
          {field.transformation ??
            "Derived value — no single source document. See the calculation above."}
        </p>
      </Section>
    );
  }

  // Group sources by document so multi-source figures show each form once.
  const byDoc = field.sources.reduce<Record<string, typeof field.sources>>((acc, s) => {
    (acc[s.documentId] ??= []).push(s);
    return acc;
  }, {});

  return (
    <Section title="Traced to source" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
      {field.transformation && (
        <div className="mb-3 rounded-md border border-line bg-surface-sunken px-3 py-2 text-[13px] text-ink-muted">
          <span className="font-medium text-ink">Transformation: </span>
          {field.transformation}
        </div>
      )}
      <div className="space-y-3">
        {Object.entries(byDoc).map(([docId, refs]) => {
          const doc = documentsById[docId];
          if (!doc) return null;
          return (
            <div key={docId}>
              <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[12px]">
                {refs.map((r) => (
                  <span
                    key={r.boxId}
                    className="inline-flex items-center gap-1 rounded-sm border border-ai-line bg-ai-soft px-1.5 py-0.5 font-medium text-ai"
                  >
                    <span className="rounded-[3px] bg-ai px-1 text-[10px] text-surface tnum">
                      p.{r.page}/{doc.pageCount}
                    </span>
                    {r.boxLabel} → <span className="tnum">${r.rawValue}</span>
                  </span>
                ))}
              </div>
              {refs[0].section && (
                <div className="mb-1 text-[11px] text-ink-subtle">
                  Page {refs[0].page} · {refs[0].section}
                </div>
              )}
              <DocumentView doc={doc} highlightBox={refs[0].boxId} page={refs[0].page} />
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------- AI panel ----------------------------------- */
function AiPanel({ field }: { field: ReturnField }) {
  const ai = field.ai!;
  const [result, setResult] = useState<AiReanalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    const r = await reanalyzeField(field);
    setResult(r);
    setLoading(false);
  };

  const tone = confidenceTone(ai.confidence);

  return (
    <Section
      title="AI analysis"
      icon={<Sparkles className="h-3.5 w-3.5 text-ai" />}
      accent
    >
      {/* confidence meter */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[12px]">
          <span className="text-ink-muted">Confidence</span>
          <span className={cx("font-semibold tnum", tone.cls)}>
            {tone.label} · {ai.confidence}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className={cx(
              "h-full rounded-full",
              ai.confidence >= 90 ? "bg-verified" : ai.confidence >= 75 ? "bg-review" : "bg-flag",
            )}
            style={{ width: `${ai.confidence}%` }}
          />
        </div>
      </div>

      <p className="text-[13px] text-ink">{ai.rationale}</p>

      {ai.concern && (
        <div className="mt-2 flex gap-2 rounded-md border border-review-line bg-review-soft px-3 py-2 text-[12.5px] text-review">
          <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>{ai.concern}</span>
        </div>
      )}

      <div className="mt-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
          Evidence
        </div>
        <ul className="space-y-1">
          {ai.evidence.map((e) => (
            <li key={e} className="flex gap-2 text-[12.5px] text-ink-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-subtle" />
              {e}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-ai-line bg-ai-soft px-2.5 py-1.5 text-[12px] font-medium text-ai hover:bg-ai-soft/70 disabled:opacity-60"
        >
          <RefreshCw className={cx("h-3.5 w-3.5", loading && "animate-spin")} strokeWidth={2} />
          {loading ? "Re-analyzing…" : "Re-run AI check"}
        </button>
        {result && !loading && (
          <span className="text-[12px] text-ink-muted">
            {result.agreesWithCurrent ? "Model agrees with current value." : "Model suggests a change."}{" "}
            Recommends: <span className="font-medium text-ink">{recLabel(result.recommendedAction)}</span>
          </span>
        )}
      </div>
    </Section>
  );
}

function recLabel(a: AiReanalysis["recommendedAction"]) {
  return a === "accept" ? "accept as-is" : a === "review" ? "human review" : "ask the client";
}

/* ------------------- corrections -------------------------------- */
function CorrectionPanel({
  field,
  actions,
}: {
  field: ReturnField;
  actions: InspectorActions;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(field.value?.toString() ?? "");
  const [reason, setReason] = useState("");

  const locked = field.affordance === "readonly" || field.affordance === "calculated";

  return (
    <Section title="Your decision" icon={<Check className="h-3.5 w-3.5" />}>
      {editing ? (
        <div className="space-y-2">
          <label className="block text-[12px] font-medium text-ink-muted">New value</label>
          <div className="flex items-center gap-1 rounded-md border border-primary-line bg-surface px-2 focus-within:ring-2 focus-within:ring-primary/30">
            <span className="text-ink-subtle">$</span>
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full bg-transparent py-1.5 text-[14px] tnum outline-none"
            />
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for the override (kept in the audit trail)"
            className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[12.5px] outline-none focus:border-primary-line focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                actions.onEdit(field.id, Number(val) || 0, reason);
                setEditing(false);
                setReason("");
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-surface hover:bg-primary-strong"
            >
              Save override
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-line px-3 py-1.5 text-[12px] font-medium text-ink-muted hover:bg-surface-sunken"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <ActionBtn
            onClick={() => actions.onVerify(field.id)}
            disabled={field.verification === "verified"}
            tone="verified"
            Icon={Check}
          >
            {field.verification === "verified" ? "Verified" : "Verify"}
          </ActionBtn>
          {!locked && (
            <ActionBtn onClick={() => setEditing(true)} tone="neutral" Icon={PenLine}>
              Edit value
            </ActionBtn>
          )}
          <ActionBtn
            onClick={() => actions.onFlag(field.id)}
            disabled={field.verification === "flagged"}
            tone="review"
            Icon={Flag}
          >
            Flag
          </ActionBtn>
          <ActionBtn onClick={() => actions.onRequestClient(field.id)} tone="neutral" Icon={Send}>
            Ask client
          </ActionBtn>
        </div>
      )}
      {locked && !editing && (
        <p className="mt-2 flex items-start gap-1.5 text-[12px] text-ink-subtle">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>
            {field.affordance === "calculated"
              ? field.inputs
                ? "This line is calculated. Open any input above to change it."
                : (field.lockReason ??
                  "This line is totalled from the source documents below — correct it at the source.")
              : (field.lockReason ?? "This value is locked and can't be edited here.")}
          </span>
        </p>
      )}
    </Section>
  );
}

function ClientNote({ field }: { field: ReturnField }) {
  return (
    <div className="rounded-md border border-line bg-surface-sunken px-3 py-2.5 text-[13px] text-ink-muted">
      {field.verification === "verified"
        ? "Your preparer has reviewed and confirmed this figure."
        : field.verification === "flagged"
          ? "Your preparer has a question about this item and will reach out."
          : "Your preparer is still reviewing this figure."}
    </div>
  );
}

/* ---------------------------- bits ------------------------------ */
function Section({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cx(
        "rounded-lg border p-3.5",
        accent ? "border-ai-line bg-ai-soft/30" : "border-line bg-surface",
      )}
    >
      <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ActionBtn({
  onClick,
  disabled,
  tone,
  Icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tone: "verified" | "review" | "neutral";
  Icon: typeof Check;
  children: React.ReactNode;
}) {
  const toneCls = {
    verified: "border-verified-line bg-verified-soft text-verified hover:bg-verified-soft/70",
    review: "border-review-line bg-review-soft text-review hover:bg-review-soft/70",
    neutral: "border-line bg-surface text-ink-muted hover:bg-surface-sunken",
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-60",
        toneCls,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {children}
    </button>
  );
}
