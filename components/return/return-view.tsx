"use client";

import { useMemo, useState } from "react";
import { Eye, Building2, CalendarClock } from "lucide-react";
import type { ReturnField, FieldSection, TaxReturn } from "@/lib/types";
import { fields as BASE_FIELDS } from "@/lib/data";
import { computeReturn } from "@/lib/compute";
import { currency, dueDisplay } from "@/lib/format";
import { stageMeta } from "@/lib/status";
import { cx } from "@/lib/cx";
import { StageTracker } from "@/components/status-ui";
import {
  ProvenanceMark,
  ConfidenceChip,
  VerificationBadge,
  accentClass,
  OpensDetail,
} from "@/components/affordance";
import { Inspector, type InspectorActions } from "./inspector";

type Override = Partial<
  Pick<ReturnField, "value" | "verification" | "history">
> & {
  note?: string;
};

const SECTION_ORDER: FieldSection[] = [
  "Income",
  "Adjustments",
  "Deductions",
  "Credits",
  "Payments",
  "Tax",
];

export function ReturnView({
  ret,
  initialField,
}: {
  ret: TaxReturn;
  /** Deep link target, resolved on the server from ?field=… */
  initialField?: string;
}) {
  const [audience, setAudience] = useState<"firm" | "client">("firm");
  const [selectedId, setSelectedId] = useState<string>(
    initialField && BASE_FIELDS.some((f) => f.id === initialField)
      ? initialField
      : BASE_FIELDS[0].id,
  );
  const [overrides, setOverrides] = useState<Record<string, Override>>({});

  /**
   * A deep link arriving while the component is already mounted (client-side
   * nav from the Documents library) updates the selection. Adjusting state
   * during render is React's recommended pattern for reacting to changed props.
   */
  const [lastDeepLink, setLastDeepLink] = useState(initialField);
  if (initialField !== lastDeepLink) {
    setLastDeepLink(initialField);
    if (initialField && BASE_FIELDS.some((f) => f.id === initialField)) {
      setSelectedId(initialField);
    }
  }

  const fields = useMemo(() => {
    const merged = BASE_FIELDS.map((f) => ({ ...f, ...overrides[f.id] }));
    // Calculated lines are genuinely derived, so an override or an approved
    // AI change ripples through the totals and the refund immediately.
    const values = Object.fromEntries(merged.map((f) => [f.id, f.value]));
    const { derived } = computeReturn(values);
    return merged.map((f) =>
      f.id in derived ? { ...f, value: derived[f.id] } : f,
    );
  }, [overrides]);

  const selected = fields.find((f) => f.id === selectedId) ?? fields[0];

  const patch = (id: string, o: Override) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...o } }));

  const stamp = (id: string, action: string, note?: string) => {
    const base = BASE_FIELDS.find((f) => f.id === id);
    const prior = overrides[id]?.history ?? base?.history ?? [];
    return [
      ...prior,
      { actor: "Priya Anand", action, at: "2026-08-05T09:30:00", note },
    ];
  };

  const actions: InspectorActions = {
    onVerify: (id) =>
      patch(id, { verification: "verified", history: stamp(id, "Verified the value") }),
    onFlag: (id) =>
      patch(id, { verification: "flagged", history: stamp(id, "Flagged for follow-up") }),
    onRequestClient: (id) =>
      patch(id, {
        verification: "flagged",
        history: stamp(id, "Sent a question to the client"),
      }),
    onEdit: (id, value, reason) =>
      patch(id, {
        value,
        verification: "verified",
        history: stamp(id, `Overrode the value to ${currency(value)}`, reason || undefined),
      }),
    onSelect: (id) => setSelectedId(id),
    onApprove: (id) => {
      const f = BASE_FIELDS.find((x) => x.id === id);
      if (f?.proposedValue === undefined) return;
      patch(id, {
        value: f.proposedValue,
        verification: "verified",
        history: stamp(id, `Approved the AI change to ${currency(f.proposedValue)}`),
      });
    },
    onReject: (id) =>
      patch(id, {
        verification: "verified",
        history: stamp(id, "Rejected the AI change; kept the current value"),
      }),
  };

  const due = dueDisplay(ret.dueDate, ret.stage);
  const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
  const grouped = SECTION_ORDER.map((section) => ({
    section,
    items: fields.filter((f) => f.section === section),
  })).filter((g) => g.items.length > 0);

  const verifiedCount = fields.filter((f) => f.verification === "verified").length;
  const flaggedCount = fields.filter((f) => f.verification === "flagged").length;
  const approvalCount = fields.filter(
    (f) => f.verification === "awaiting_approval",
  ).length;

  return (
    <div className="flex h-full flex-col">
      {/* ---------- Return header ---------- */}
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-semibold tracking-tight">{ret.client}</h1>
              <span className="rounded-sm border border-line bg-surface-sunken px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
                {ret.entityType}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-muted">
              <span>Form 1040 · TY{ret.taxYear} · {ret.id}</span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                {ret.preparer} · Reviewer {ret.reviewer}
              </span>
              <span
                className={cx(
                  "flex items-center gap-1",
                  due.tone === "overdue" && "font-medium text-flag",
                  due.tone === "soon" && "font-medium text-review",
                )}
              >
                <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
                {due.text}
              </span>
            </div>
          </div>

          {/* audience toggle */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex rounded-md border border-line bg-surface p-0.5 text-[12.5px]">
              {(["firm", "client"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={cx(
                    "flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-colors",
                    audience === a ? "bg-primary text-surface" : "text-ink-muted hover:text-ink",
                  )}
                >
                  <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                  {a === "firm" ? "Firm view" : "Client view"}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-ink-subtle">
              {audience === "firm" ? "Full detail & AI internals" : "What the client sees"}
            </span>
          </div>
        </div>

        {/* status tracker */}
        <div className="mt-4 rounded-lg border border-line bg-surface-sunken px-4 py-3">
          <StageTracker stage={ret.stage} audience={audience} />
          <div className="mt-2 text-center text-[12px] text-ink-muted">
            {audience === "firm" ? stageMeta(ret.stage).detail : stageMeta(ret.stage).clientDetail}
          </div>
        </div>

        {/* summary figures */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Adjusted gross income" value={currency(byId["f-agi"]?.value ?? null)} />
          <SummaryStat label="Total tax" value={currency(byId["f-total-tax"]?.value ?? null)} />
          <SummaryStat
            label="Refund"
            value={currency(byId["f-refund"]?.value ?? null)}
            tone="verified"
          />
          <SummaryStat
            label={audience === "firm" ? "Verified / open" : "Items reviewed"}
            value={
              audience === "firm"
                ? `${verifiedCount} / ${flaggedCount + approvalCount}`
                : `${verifiedCount} of ${fields.length}`
            }
            hint={
              audience === "firm" && approvalCount > 0
                ? `${approvalCount} awaiting approval`
                : undefined
            }
          />
        </div>
      </div>

      {/* ---------- Two-pane workbench ---------- */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* field list */}
        <div className="min-h-0 overflow-auto border-r border-line">
          {audience === "client" && (
            <div className="border-b border-line bg-primary-soft/50 px-6 py-2.5 text-[12.5px] text-primary">
              You&apos;re seeing your return the way your client does — plain figures, no internal notes.
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.section}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface-sunken px-6 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  {g.section}
                </span>
              </div>
              {g.items.map((f) => (
                <FieldRow
                  key={f.id}
                  field={f}
                  audience={audience}
                  selected={f.id === selectedId}
                  onClick={() => setSelectedId(f.id)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* inspector */}
        <div className="min-h-0 overflow-hidden bg-canvas">
          {/*
            `key` matters: without it React reuses the panel across selections,
            so the edit form and any re-run AI result would carry over from the
            previously selected field.
          */}
          <Inspector
            key={selected.id}
            field={selected}
            allFields={fields}
            audience={audience}
            actions={actions}
          />
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  audience,
  selected,
  onClick,
}: {
  field: ReturnField;
  audience: "firm" | "client";
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-3 px-6 py-2.5 text-left transition-colors",
        accentClass(field.verification),
        selected ? "bg-primary-soft/60" : "hover:bg-surface-sunken",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-medium">{field.label}</span>
          {audience === "firm" && <ProvenanceMark provenance={field.provenance} size="xs" />}
        </div>
        <div className="text-[11px] text-ink-subtle">{field.formLine}</div>
      </div>

      <div className="flex items-center gap-2">
        {audience === "firm" && field.ai && <ConfidenceChip value={field.ai.confidence} />}
        {audience === "firm" ? (
          <VerificationBadge verification={field.verification} />
        ) : (
          <ClientState verification={field.verification} />
        )}
        <span className="w-24 text-right text-[14px] font-semibold tnum">
          {currency(field.value)}
        </span>
        <OpensDetail />
      </div>
    </button>
  );
}

function ClientState({ verification }: { verification: ReturnField["verification"] }) {
  if (verification === "verified")
    return <span className="text-[11px] font-medium text-verified">Reviewed</span>;
  if (verification === "flagged")
    return <span className="text-[11px] font-medium text-review">Question</span>;
  return <span className="text-[11px] text-ink-subtle">In progress</span>;
}

function SummaryStat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "verified";
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <div className="text-[11px] text-ink-subtle">{label}</div>
      <div className={cx("mt-0.5 text-[16px] font-semibold tnum", tone === "verified" && "text-verified")}>
        {value}
      </div>
      {hint && <div className="text-[10.5px] text-primary">{hint}</div>}
    </div>
  );
}
