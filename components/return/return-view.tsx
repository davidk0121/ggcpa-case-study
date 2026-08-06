"use client";

import { useMemo, useState } from "react";
import { Eye, Building2, CalendarClock } from "lucide-react";
import type { ReturnField, FieldSection, TaxReturn } from "@/lib/types";
import { fields as BASE_FIELDS } from "@/lib/data";
import { currency, dueLabel, daysUntil } from "@/lib/format";
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

type Override = Partial<Pick<ReturnField, "value" | "verification">> & {
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

export function ReturnView({ ret }: { ret: TaxReturn }) {
  const [audience, setAudience] = useState<"firm" | "client">("firm");
  const [selectedId, setSelectedId] = useState<string>(BASE_FIELDS[0].id);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});

  const fields = useMemo(
    () => BASE_FIELDS.map((f) => ({ ...f, ...overrides[f.id] })),
    [overrides],
  );
  const selected = fields.find((f) => f.id === selectedId) ?? fields[0];

  const patch = (id: string, o: Override) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...o } }));

  const actions: InspectorActions = {
    onVerify: (id) => patch(id, { verification: "verified" }),
    onFlag: (id) => patch(id, { verification: "flagged" }),
    onRequestClient: (id) => patch(id, { verification: "flagged", note: "Sent to client" }),
    onEdit: (id, value, reason) =>
      patch(id, { value, verification: "verified", note: reason }),
    onSelect: (id) => setSelectedId(id),
  };

  const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
  const grouped = SECTION_ORDER.map((section) => ({
    section,
    items: fields.filter((f) => f.section === section),
  })).filter((g) => g.items.length > 0);

  const verifiedCount = fields.filter((f) => f.verification === "verified").length;
  const flaggedCount = fields.filter((f) => f.verification === "flagged").length;

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
              <span className={cx("flex items-center gap-1", daysUntil(ret.dueDate) <= 3 && "font-medium text-review")}>
                <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
                {dueLabel(ret.dueDate)}
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
            label={audience === "firm" ? "Verified / flagged" : "Items reviewed"}
            value={audience === "firm" ? `${verifiedCount} / ${flaggedCount}` : `${verifiedCount} of ${fields.length}`}
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
          <Inspector field={selected} audience={audience} actions={actions} />
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
}: {
  label: string;
  value: string;
  tone?: "verified";
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <div className="text-[11px] text-ink-subtle">{label}</div>
      <div className={cx("mt-0.5 text-[16px] font-semibold tnum", tone === "verified" && "text-verified")}>
        {value}
      </div>
    </div>
  );
}
