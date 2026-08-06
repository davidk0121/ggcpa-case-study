"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Flag,
  UserRoundCheck,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { returns as ALL_RETURNS } from "@/lib/data";
import { prioritize, preparerLoads, type RankedReturn } from "@/lib/prioritize";
import { balanceLabel, dueLabel, daysUntil, relativeTime } from "@/lib/format";
import { stageMeta } from "@/lib/status";
import { cx } from "@/lib/cx";
import { StageBadge } from "@/components/status-ui";

const ME = "You (Priya Anand)";
const PAGE_SIZE = 12;

/** Three lenses on the same book of business. */
type Scope = "mine" | "firm" | "manager";

const URGENCY_STYLE: Record<RankedReturn["urgency"], string> = {
  critical: "bg-flag",
  high: "bg-review",
  normal: "bg-primary",
  low: "bg-ink-subtle",
};

export function Dashboard() {
  const [scope, setScope] = useState<Scope>("mine");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const ranked = useMemo(
    () => prioritize(ALL_RETURNS, { onlyMine: scope === "mine", preparer: ME }),
    [scope],
  );

  const scopedReturns = useMemo(
    () =>
      scope === "mine"
        ? ALL_RETURNS.filter((r) => r.preparer === ME || r.reviewer === ME)
        : ALL_RETURNS,
    [scope],
  );

  const metrics = useMemo(() => {
    const active = scopedReturns.filter((r) => r.stage !== "filed");
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
      active: active.length,
    };
  }, [scopedReturns]);

  const queue = ranked.filter((r) => r.ret.stage !== "filed").slice(0, 4);
  const loads = useMemo(() => preparerLoads(ALL_RETURNS), []);

  // Table: filter → then paginate, so volume stays navigable.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked.filter(({ ret }) => {
      if (stageFilter && ret.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        ret.client.toLowerCase().includes(q) ||
        ret.id.toLowerCase().includes(q) ||
        ret.preparer.toLowerCase().includes(q)
      );
    });
  }, [ranked, stageFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const reset = (fn: () => void) => {
    fn();
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Greeting + scope */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">
            Good morning, Priya
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Tuesday, August 5 ·{" "}
            {scope === "manager"
              ? `${loads.length} preparers · ${ALL_RETURNS.filter((r) => r.stage !== "filed").length} active returns`
              : "Here's what needs a decision today."}
          </p>
        </div>
        <div className="flex rounded-md border border-line bg-surface p-0.5 text-[13px]">
          {(
            [
              ["mine", "My queue"],
              ["firm", "All firm"],
              ["manager", "Manager"],
            ] as const
          ).map(([s, label]) => (
            <button
              key={s}
              onClick={() => reset(() => setScope(s))}
              className={cx(
                "rounded px-3 py-1 font-medium transition-colors",
                scope === s ? "bg-primary text-surface" : "text-ink-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Needs you now" value={metrics.needsYou} hint="firm-owned, due ≤ 3 days" Icon={AlertTriangle} tone="flag" />
        <Metric label="Due this week" value={metrics.dueWeek} hint="within 7 days" Icon={Clock} tone="review" />
        <Metric label="Open AI flags" value={metrics.flags} hint="awaiting a decision" Icon={Flag} tone="ai" />
        <Metric label="Waiting on clients" value={metrics.waiting} hint="ball in their court" Icon={UserRoundCheck} tone="neutral" />
      </div>

      {/* Manager rollup — a different question: who's underwater? */}
      {scope === "manager" && (
        <section className="mt-7">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              Team load
            </h2>
            <span className="text-[12px] text-ink-subtle">
              Pressure = overdue × 14 + due-this-week × 6 + flags × 2
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-sunken text-left text-[11px] uppercase tracking-wide text-ink-subtle">
                  <th className="px-4 py-2 font-semibold">Preparer</th>
                  <th className="px-4 py-2 font-semibold">Load</th>
                  <th className="px-4 py-2 text-right font-semibold">Active</th>
                  <th className="px-4 py-2 text-right font-semibold">Overdue</th>
                  <th className="px-4 py-2 text-right font-semibold">Due ≤7d</th>
                  <th className="px-4 py-2 text-right font-semibold">Flags</th>
                  <th className="px-4 py-2 font-semibold">Most urgent</th>
                </tr>
              </thead>
              <tbody>
                {loads.map((l) => (
                  <tr key={l.preparer} className="border-b border-line last:border-0 hover:bg-surface-sunken">
                    <td className="px-4 py-2.5 font-medium">
                      {l.preparer}
                      {l.preparer === ME && (
                        <span className="ml-1.5 rounded-sm border border-primary-line bg-primary-soft px-1 py-px text-[10px] text-primary">
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                          <div
                            className={cx(
                              "h-full rounded-full",
                              l.load >= 75 ? "bg-flag" : l.load >= 45 ? "bg-review" : "bg-primary",
                            )}
                            style={{ width: `${l.load}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-ink-subtle tnum">{l.load}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tnum">{l.active}</td>
                    <td className={cx("px-4 py-2.5 text-right tnum", l.overdue > 0 && "font-semibold text-flag")}>
                      {l.overdue || "—"}
                    </td>
                    <td className={cx("px-4 py-2.5 text-right tnum", l.dueThisWeek > 0 && "text-review")}>
                      {l.dueThisWeek || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tnum">{l.flags || "—"}</td>
                    <td className="px-4 py-2.5">
                      {l.topItem ? (
                        <Link
                          href={`/returns/${l.topItem.ret.id}`}
                          className="group inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-primary"
                        >
                          <span className="max-w-[150px] truncate">{l.topItem.ret.client}</span>
                          <span className="text-ink-subtle">·</span>
                          <span className="whitespace-nowrap text-[11px]">{l.topItem.reason}</span>
                          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} />
                        </Link>
                      ) : (
                        <span className="text-ink-subtle">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Priority queue */}
      {scope !== "manager" && (
        <section className="mt-7">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
              Your priority queue
            </h2>
            <span className="text-[12px] text-ink-subtle">
              Top 4 of {metrics.active} active · ranked by deadline, ownership &amp; flags
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
            {queue.map((r, i) => (
              <QueueRow key={r.ret.id} r={r} first={i === 0} />
            ))}
          </div>
        </section>
      )}

      {/* Full table — search, filter, paginate */}
      <section className="mt-7">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
            {scope === "mine" ? "My returns" : "All returns"}
          </h2>
          <span className="text-[12px] text-ink-subtle">
            {filtered.length} of {ranked.length}
          </span>
          <div className="ml-auto flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/25">
            <Search className="h-3.5 w-3.5 text-ink-subtle" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => reset(() => setQuery(e.target.value))}
              placeholder="Search client, ID, preparer…"
              className="w-48 bg-transparent text-[12.5px] outline-none placeholder:text-ink-subtle"
            />
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-1">
          <FilterChip label="All" active={stageFilter === null} onClick={() => reset(() => setStageFilter(null))} />
          {["in_prep", "in_review", "client_review", "ready_to_file", "intake", "filed"].map((s) => (
            <FilterChip
              key={s}
              label={stageMeta(s as never).label}
              active={stageFilter === s}
              onClick={() => reset(() => setStageFilter(s))}
            />
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-left text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-2 font-semibold">Client</th>
                <th className="px-4 py-2 font-semibold">Stage</th>
                <th className="px-4 py-2 font-semibold">Next action</th>
                {scope !== "mine" && <th className="px-4 py-2 font-semibold">Preparer</th>}
                <th className="px-4 py-2 font-semibold">Progress</th>
                <th className="px-4 py-2 text-right font-semibold">Balance</th>
                <th className="px-4 py-2 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ ret }) => {
                const bal = balanceLabel(ret.balance);
                const dueDays = daysUntil(ret.dueDate);
                return (
                  <tr key={ret.id} className="group border-b border-line last:border-0 hover:bg-surface-sunken">
                    <td className="px-4 py-2.5">
                      <Link href={`/returns/${ret.id}`} className="block">
                        <div className="font-medium text-ink group-hover:text-primary">{ret.client}</div>
                        <div className="text-[11px] text-ink-subtle">
                          {ret.entityType} · {ret.id} · updated {relativeTime(ret.lastActivity)}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5"><StageBadge stage={ret.stage} /></td>
                    <td className="px-4 py-2.5"><OwnerPill owner={ret.nextActionOwner} flags={ret.openFlags} /></td>
                    {scope !== "mine" && (
                      <td className="px-4 py-2.5 text-[12px] text-ink-muted">
                        {ret.preparer.replace("You (", "").replace(")", "")}
                      </td>
                    )}
                    <td className="px-4 py-2.5"><ProgressBar value={ret.progress} /></td>
                    <td className={cx("px-4 py-2.5 text-right tnum", bal.kind === "due" ? "text-flag" : bal.kind === "refund" ? "text-verified" : "text-ink-subtle")}>
                      {bal.text}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cx("tnum text-[12px]", dueDays < 0 ? "font-medium text-flag" : dueDays <= 3 ? "font-medium text-review" : "text-ink-muted")}>
                        {dueLabel(ret.dueDate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-ink-subtle">
                    Nothing matches those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-line bg-surface-sunken px-4 py-2">
              <span className="text-[12px] text-ink-subtle tnum">
                {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <PageBtn disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                </PageBtn>
                <span className="px-2 text-[12px] text-ink-muted tnum">
                  {safePage + 1} / {pageCount}
                </span>
                <PageBtn disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </PageBtn>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PageBtn({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded border border-line bg-surface p-1 text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
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
  const toneCls = { flag: "text-flag", review: "text-review", ai: "text-ai", neutral: "text-ink-muted" }[tone];
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
      className={cx("group flex items-center gap-4 px-4 py-3 hover:bg-surface-sunken", !first && "border-t border-line")}
    >
      <span className={cx("h-2 w-2 shrink-0 rounded-full", URGENCY_STYLE[r.urgency])} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-ink group-hover:text-primary">{ret.client}</span>
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
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
        <div
          className={cx("h-full rounded-full", value === 100 ? "bg-verified" : "bg-primary")}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[11px] text-ink-subtle tnum">{value}%</span>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-md border px-2 py-1 text-[12px] font-medium transition-colors",
        active ? "border-primary bg-primary text-surface" : "border-line bg-surface text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
