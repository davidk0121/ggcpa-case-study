"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { returns as ALL_RETURNS } from "@/lib/data";
import { balanceLabel, dueDisplay, daysUntil, relativeTime } from "@/lib/format";
import { stageMeta } from "@/lib/status";
import { cx } from "@/lib/cx";
import { StageBadge } from "@/components/status-ui";

const STAGES = ["intake", "in_prep", "in_review", "client_review", "ready_to_file", "filed"] as const;

const PAGE_SIZE = 20;

type SortKey = "due" | "client" | "progress" | "balance";

export function ReturnsList() {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("due");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = ALL_RETURNS.filter((r) => {
      if (stageFilter && r.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        r.client.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.entityType.toLowerCase().includes(q) ||
        r.preparer.toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "client":
          return a.client.localeCompare(b.client);
        case "progress":
          return b.progress - a.progress;
        case "balance":
          return Math.abs(b.balance) - Math.abs(a.balance);
        default:
          return daysUntil(a.dueDate) - daysUntil(b.dueDate);
      }
    });
    return sorted;
  }, [query, stageFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const reset = (fn: () => void) => {
    fn();
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Returns</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {rows.length} of {ALL_RETURNS.length} returns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => reset(() => setSort(e.target.value as SortKey))}
            className="rounded-md border border-line bg-surface px-2 py-1.5 text-[12.5px] text-ink-muted outline-none focus:ring-2 focus:ring-primary/25"
            aria-label="Sort returns"
          >
            <option value="due">Sort: soonest due</option>
            <option value="client">Sort: client A–Z</option>
            <option value="progress">Sort: most complete</option>
            <option value="balance">Sort: largest balance</option>
          </select>
          <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/25">
            <Search className="h-4 w-4 text-ink-subtle" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => reset(() => setQuery(e.target.value))}
              placeholder="Search client, ID, preparer…"
              className="w-52 bg-transparent text-[13px] outline-none placeholder:text-ink-subtle"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        <Chip label="All" active={stageFilter === null} onClick={() => reset(() => setStageFilter(null))} />
        {STAGES.map((s) => (
          <Chip
            key={s}
            label={stageMeta(s).label}
            active={stageFilter === s}
            onClick={() => reset(() => setStageFilter(s))}
          />
        ))}
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface shadow-panel">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-[11px] uppercase tracking-wide text-ink-subtle">
              <th scope="col" className="px-4 py-2 font-semibold">Client</th>
              <th scope="col" className="px-4 py-2 font-semibold">Stage</th>
              <th scope="col" className="px-4 py-2 font-semibold">Next action</th>
              <th scope="col" className="px-4 py-2 font-semibold">Preparer</th>
              <th scope="col" className="px-4 py-2 text-right font-semibold">Balance</th>
              <th scope="col" className="px-4 py-2 font-semibold">Due</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((ret) => {
              const bal = balanceLabel(ret.balance);
              const due = dueDisplay(ret.dueDate, ret.stage);
              return (
                <tr key={ret.id} className="group border-b border-line last:border-0 hover:bg-surface-sunken">
                  <td className="px-4 py-2.5">
                    <Link href={`/returns/${ret.id}`} className="block">
                      <div className="font-medium group-hover:text-primary">{ret.client}</div>
                      <div className="text-[11px] text-ink-subtle">
                        {ret.entityType} · {ret.id} · updated {relativeTime(ret.lastActivity)}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5"><StageBadge stage={ret.stage} /></td>
                  <td className="px-4 py-2.5">
                    {ret.stage === "filed" ? (
                      <span className="text-[11px] text-ink-subtle">Complete</span>
                    ) : (
                      <span
                        className={cx(
                          "rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
                          ret.nextActionOwner === "firm"
                            ? "border-primary-line bg-primary-soft text-primary"
                            : "border-line bg-surface-sunken text-ink-muted",
                        )}
                      >
                        {ret.nextActionOwner === "firm" ? "Firm" : "Client"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-muted">
                    {ret.preparer.replace("You (", "").replace(")", "")}
                  </td>
                  <td className={cx("px-4 py-2.5 text-right tnum", bal.kind === "due" ? "text-flag" : bal.kind === "refund" ? "text-verified" : "text-ink-subtle")}>
                    {bal.text}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cx(
                        "tnum text-[12px]",
                        due.tone === "overdue"
                          ? "font-medium text-flag"
                          : due.tone === "soon"
                            ? "font-medium text-review"
                            : due.tone === "done"
                              ? "text-ink-subtle"
                              : "text-ink-muted",
                      )}
                    >
                      {due.text}
                    </span>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-ink-subtle">
                  No returns match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-line bg-surface-sunken px-4 py-2">
            <span className="text-[12px] text-ink-subtle tnum">
              {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, rows.length)} of{" "}
              {rows.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
                className="rounded border border-line bg-surface p-1 text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <span className="px-2 text-[12px] text-ink-muted tnum">
                {safePage + 1} / {pageCount}
              </span>
              <button
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
                className="rounded border border-line bg-surface p-1 text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-md border px-2 py-1 text-[12px] font-medium transition-colors",
        active ? "border-primary bg-primary text-surface" : "border-line bg-surface text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
