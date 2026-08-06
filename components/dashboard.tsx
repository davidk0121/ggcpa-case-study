"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Flag,
  UserRoundCheck,
  ArrowRight,
} from "lucide-react";
import { returns as ALL_RETURNS } from "@/lib/data";
import { prioritize, type RankedReturn } from "@/lib/prioritize";
import { balanceLabel, dueLabel, daysUntil, relativeTime } from "@/lib/format";
import { stageMeta } from "@/lib/status";
import { cx } from "@/lib/cx";
import { StageBadge } from "@/components/status-ui";

const ME = "You (Priya Anand)";

const URGENCY_STYLE: Record<RankedReturn["urgency"], string> = {
  critical: "bg-flag",
  high: "bg-review",
  normal: "bg-primary",
  low: "bg-ink-subtle",
};

export function Dashboard() {
  const [scope, setScope] = useState<"mine" | "firm">("mine");
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const ranked = useMemo(
    () =>
      prioritize(ALL_RETURNS, {
        onlyMine: scope === "mine",
        preparer: ME,
      }),
    [scope],
  );

  const metrics = useMemo(() => {
    const scoped =
      scope === "mine"
        ? ALL_RETURNS.filter((r) => r.preparer === ME || r.reviewer === ME)
        : ALL_RETURNS;
    const active = scoped.filter((r) => r.stage !== "filed");
    return {
      needsYou: active.filter(
        (r) => r.nextActionOwner === "firm" && daysUntil(r.dueDate) <= 3,
      ).length,
      dueWeek: active.filter((r) => {
        const d = daysUntil(r.dueDate);
        return d >= 0 && d <= 7;
      }).length,
      flags: active.reduce((n, r) => n + r.openFlags, 0),
      waiting: active.filter((r) => r.nextActionOwner === "client").length,
    };
  }, [scope]);

  const queue = ranked.filter((r) => r.ret.stage !== "filed").slice(0, 4);

  const tableRows = useMemo(() => {
    let rows = ranked;
    if (stageFilter) rows = rows.filter((r) => r.ret.stage === stageFilter);
    return rows;
  }, [ranked, stageFilter]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Greeting + scope toggle */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">
            Good morning, Priya
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Tuesday, August 5 · Here&apos;s what needs a decision today.
          </p>
        </div>
        <div className="flex rounded-md border border-line bg-surface p-0.5 text-[13px]">
          {(["mine", "firm"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cx(
                "rounded px-3 py-1 font-medium transition-colors",
                scope === s
                  ? "bg-primary text-surface"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {s === "mine" ? "My queue" : "All firm"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric tiles — decision-relevant, not vanity */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Needs you now"
          value={metrics.needsYou}
          hint="firm-owned, due ≤ 3 days"
          Icon={AlertTriangle}
          tone="flag"
        />
        <Metric
          label="Due this week"
          value={metrics.dueWeek}
          hint="within 7 days"
          Icon={Clock}
          tone="review"
        />
        <Metric
          label="Open AI flags"
          value={metrics.flags}
          hint="awaiting a decision"
          Icon={Flag}
          tone="ai"
        />
        <Metric
          label="Waiting on clients"
          value={metrics.waiting}
          hint="ball in their court"
          Icon={UserRoundCheck}
          tone="neutral"
        />
      </div>

      {/* Priority queue */}
      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
            Your priority queue
          </h2>
          <span className="text-[12px] text-ink-subtle">
            Ranked by deadline, ownership & open flags
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
          {queue.map((r, i) => (
            <QueueRow key={r.ret.id} r={r} first={i === 0} />
          ))}
        </div>
      </section>

      {/* Full table with stage filter */}
      <section className="mt-7">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
            All returns
          </h2>
          <div className="flex flex-wrap gap-1">
            <FilterChip
              label="All"
              active={stageFilter === null}
              onClick={() => setStageFilter(null)}
            />
            {["in_prep", "in_review", "client_review", "ready_to_file", "intake"].map(
              (s) => (
                <FilterChip
                  key={s}
                  label={stageMeta(s as never).label}
                  active={stageFilter === s}
                  onClick={() => setStageFilter(s)}
                />
              ),
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-left text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-2 font-semibold">Client</th>
                <th className="px-4 py-2 font-semibold">Stage</th>
                <th className="px-4 py-2 font-semibold">Next action</th>
                <th className="px-4 py-2 font-semibold">Progress</th>
                <th className="px-4 py-2 text-right font-semibold">Balance</th>
                <th className="px-4 py-2 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ ret }) => {
                const bal = balanceLabel(ret.balance);
                const dueDays = daysUntil(ret.dueDate);
                return (
                  <tr
                    key={ret.id}
                    className="group border-b border-line last:border-0 hover:bg-surface-sunken"
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/returns/${ret.id}`} className="block">
                        <div className="font-medium text-ink group-hover:text-primary">
                          {ret.client}
                        </div>
                        <div className="text-[11px] text-ink-subtle">
                          {ret.entityType} · {ret.id} · updated {relativeTime(ret.lastActivity)}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <StageBadge stage={ret.stage} />
                    </td>
                    <td className="px-4 py-2.5">
                      <OwnerPill owner={ret.nextActionOwner} flags={ret.openFlags} />
                    </td>
                    <td className="px-4 py-2.5">
                      <ProgressBar value={ret.progress} />
                    </td>
                    <td className={cx("px-4 py-2.5 text-right tnum", bal.kind === "due" ? "text-flag" : bal.kind === "refund" ? "text-verified" : "text-ink-subtle")}>
                      {bal.text}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cx(
                          "tnum text-[12px]",
                          dueDays < 0
                            ? "font-medium text-flag"
                            : dueDays <= 3
                              ? "font-medium text-review"
                              : "text-ink-muted",
                        )}
                      >
                        {dueLabel(ret.dueDate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  Icon: typeof Clock;
  tone: "flag" | "review" | "ai" | "neutral";
}) {
  const toneCls = {
    flag: "text-flag",
    review: "text-review",
    ai: "text-ai",
    neutral: "text-ink-muted",
  }[tone];
  return (
    <div className="rounded-lg border border-line bg-surface p-3.5 shadow-panel">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-muted">{label}</span>
        <Icon className={cx("h-4 w-4", toneCls)} strokeWidth={2} />
      </div>
      <div className="mt-1.5 text-[28px] font-semibold leading-none tnum">{value}</div>
      <div className="mt-1 text-[11px] text-ink-subtle">{hint}</div>
    </div>
  );
}

function QueueRow({ r, first }: { r: RankedReturn; first: boolean }) {
  const { ret } = r;
  const bal = balanceLabel(ret.balance);
  return (
    <Link
      href={`/returns/${ret.id}`}
      className={cx(
        "group flex items-center gap-4 px-4 py-3 hover:bg-surface-sunken",
        !first && "border-t border-line",
      )}
    >
      <span className={cx("h-2 w-2 shrink-0 rounded-full", URGENCY_STYLE[r.urgency])} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-ink group-hover:text-primary">
            {ret.client}
          </span>
          <StageBadge stage={ret.stage} />
        </div>
        <div className="mt-0.5 text-[12px] text-ink-subtle">
          {ret.entityType} · {ret.id}
        </div>
      </div>
      <div className="hidden items-center gap-1.5 sm:flex">
        {r.reason.split(" · ").map((part) => (
          <span
            key={part}
            className={cx(
              "rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
              r.urgency === "critical"
                ? "border-flag-line bg-flag-soft text-flag"
                : r.urgency === "high"
                  ? "border-review-line bg-review-soft text-review"
                  : "border-line bg-surface-sunken text-ink-muted",
            )}
          >
            {part}
          </span>
        ))}
      </div>
      <div className={cx("hidden w-24 text-right text-[12px] tnum md:block", bal.kind === "due" ? "text-flag" : "text-ink-muted")}>
        {bal.text}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={2} />
    </Link>
  );
}

function OwnerPill({ owner, flags }: { owner: "firm" | "client"; flags: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cx(
          "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
          owner === "firm"
            ? "border-primary-line bg-primary-soft text-primary"
            : "border-line bg-surface-sunken text-ink-muted",
        )}
      >
        {owner === "firm" ? "Firm" : "Client"}
      </span>
      {flags > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-review">
          <Flag className="h-3 w-3" strokeWidth={2} />
          {flags}
        </span>
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
        <div
          className={cx("h-full rounded-full", value === 100 ? "bg-verified" : "bg-primary")}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-ink-subtle tnum">{value}%</span>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-md border px-2 py-1 text-[12px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-surface"
          : "border-line bg-surface text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
