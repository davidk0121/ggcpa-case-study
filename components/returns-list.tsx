"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { returns as ALL_RETURNS } from "@/lib/data";
import { balanceLabel, dueLabel, daysUntil, relativeTime } from "@/lib/format";
import { stageMeta } from "@/lib/status";
import { cx } from "@/lib/cx";
import { StageBadge } from "@/components/status-ui";

const STAGES = ["intake", "in_prep", "in_review", "client_review", "ready_to_file", "filed"] as const;

export function ReturnsList() {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_RETURNS.filter((r) => {
      if (stageFilter && r.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        r.client.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.entityType.toLowerCase().includes(q)
      );
    });
  }, [query, stageFilter]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Returns</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {rows.length} of {ALL_RETURNS.length} returns
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/25">
          <Search className="h-4 w-4 text-ink-subtle" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, ID, type…"
            className="w-56 bg-transparent text-[13px] outline-none placeholder:text-ink-subtle"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        <Chip label="All" active={stageFilter === null} onClick={() => setStageFilter(null)} />
        {STAGES.map((s) => (
          <Chip
            key={s}
            label={stageMeta(s).label}
            active={stageFilter === s}
            onClick={() => setStageFilter(s)}
          />
        ))}
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-[11px] uppercase tracking-wide text-ink-subtle">
              <th className="px-4 py-2 font-semibold">Client</th>
              <th className="px-4 py-2 font-semibold">Stage</th>
              <th className="px-4 py-2 font-semibold">Next action</th>
              <th className="px-4 py-2 text-right font-semibold">Balance</th>
              <th className="px-4 py-2 font-semibold">Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ret) => {
              const bal = balanceLabel(ret.balance);
              const d = daysUntil(ret.dueDate);
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
                  </td>
                  <td className={cx("px-4 py-2.5 text-right tnum", bal.kind === "due" ? "text-flag" : bal.kind === "refund" ? "text-verified" : "text-ink-subtle")}>
                    {bal.text}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cx("tnum text-[12px]", d < 0 ? "font-medium text-flag" : d <= 3 ? "font-medium text-review" : "text-ink-muted")}>
                      {dueLabel(ret.dueDate)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-ink-subtle">
                  No returns match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
