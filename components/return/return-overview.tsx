"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  FileText,
  MessageCircleQuestion,
  PenTool,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import type { TaxReturn, OpenItem } from "@/lib/types";
import { balanceLabel, dueDisplay } from "@/lib/format";
import { stageMeta } from "@/lib/status";
import { cx } from "@/lib/cx";
import { StageTracker } from "@/components/status-ui";
import { FLAGSHIP_RETURN_ID } from "@/lib/data";

const ITEM_ICON = {
  document: FileText,
  question: MessageCircleQuestion,
  signature: PenTool,
  review: ClipboardCheck,
} as const;

export function ReturnOverview({ ret }: { ret: TaxReturn }) {
  const [audience, setAudience] = useState<"firm" | "client">("firm");
  const bal = balanceLabel(ret.balance);
  const due = dueDisplay(ret.dueDate, ret.stage);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">{ret.client}</h1>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            {ret.entityType} · TY{ret.taxYear} · {ret.id} ·{" "}
            <span
              className={cx(
                due.tone === "overdue" && "font-medium text-flag",
                due.tone === "soon" && "font-medium text-review",
              )}
            >
              {due.text}
            </span>
          </p>
        </div>
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
      </div>

      <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-4 shadow-panel">
        <StageTracker stage={ret.stage} audience={audience} />
        <div className="mt-3 text-center text-[13px] text-ink-muted">
          {audience === "firm" ? stageMeta(ret.stage).detail : stageMeta(ret.stage).clientDetail}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* what's next */}
        <div className="rounded-lg border border-line bg-surface p-4 shadow-panel">
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            What&apos;s next
          </h2>
          <div className="mb-3 flex items-center gap-2 text-[13px]">
            <span
              className={cx(
                "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
                ret.nextActionOwner === "firm"
                  ? "border-primary-line bg-primary-soft text-primary"
                  : "border-review-line bg-review-soft text-review",
              )}
            >
              {ret.nextActionOwner === "firm" ? "We own the next step" : "Waiting on client"}
            </span>
          </div>
          <ul className="space-y-2">
            {ret.openItems.length === 0 && (
              <li className="text-[13px] text-ink-subtle">No open items. Nothing blocking.</li>
            )}
            {ret.openItems.map((it) => (
              <OpenItemRow key={it.id} item={it} audience={audience} />
            ))}
          </ul>
        </div>

        {/* facts */}
        <div className="rounded-lg border border-line bg-surface p-4 shadow-panel">
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            Summary
          </h2>
          <dl className="space-y-2 text-[13px]">
            <Row label="Estimated outcome">
              <span className={cx("font-semibold tnum", bal.kind === "due" ? "text-flag" : "text-verified")}>
                {bal.text}
              </span>
            </Row>
            <Row label="Progress">{ret.progress}% complete</Row>
            {audience === "firm" && (
              <>
                <Row label="Preparer">{ret.preparer}</Row>
                <Row label="Reviewer">{ret.reviewer}</Row>
                <Row label="Open flags">
                  {ret.openFlags > 0 ? (
                    <span className="font-medium text-review">{ret.openFlags}</span>
                  ) : (
                    "None"
                  )}
                </Row>
              </>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-dashed border-line bg-surface-sunken px-4 py-3 text-[13px] text-ink-muted">
        This is the status overview. The full line-by-line{" "}
        <span className="font-medium text-ink">traceable workbench</span> is wired up on{" "}
        <Link href={`/returns/${FLAGSHIP_RETURN_ID}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          the Delgado return
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
        .
      </div>
    </div>
  );
}

function OpenItemRow({ item, audience }: { item: OpenItem; audience: "firm" | "client" }) {
  const Icon = ITEM_ICON[item.kind];
  return (
    <li className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-muted ring-1 ring-line">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="flex-1 text-[13px]">{item.label}</span>
      <span
        className={cx(
          "rounded-sm border px-1.5 py-0.5 text-[10.5px] font-medium",
          item.owner === "firm"
            ? "border-primary-line bg-primary-soft text-primary"
            : "border-line bg-surface text-ink-muted",
        )}
      >
        {item.owner === "firm" ? (audience === "firm" ? "Us" : "Your CPA") : "Client"}
      </span>
    </li>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-subtle">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
