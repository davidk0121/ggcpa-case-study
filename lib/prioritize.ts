import type { TaxReturn } from "./types";
import { daysUntil } from "./format";

// Ranking for the dashboard queue. The score favours work that's close to a
// deadline, owned by the firm, and blocked on a flag. Returns waiting on the
// client score lower, since the preparer can't move them. Each ranked item
// keeps a short `reason` so the ordering can be shown, not just applied.

export interface RankedReturn {
  ret: TaxReturn;
  score: number;
  reason: string;
  urgency: "critical" | "high" | "normal" | "low";
}

export function scoreReturn(ret: TaxReturn): RankedReturn {
  const days = daysUntil(ret.dueDate);
  let score = 0;
  const reasons: string[] = [];

  // Deadline pressure is the biggest factor.
  if (days < 0) {
    score += 100 + Math.abs(days) * 5;
    reasons.push(`${Math.abs(days)}d overdue`);
  } else if (days <= 1) {
    score += 80;
    reasons.push(days === 0 ? "due today" : "due tomorrow");
  } else if (days <= 3) {
    score += 55;
    reasons.push(`due in ${days}d`);
  } else if (days <= 7) {
    score += 30;
    reasons.push(`due in ${days}d`);
  } else {
    score += Math.max(0, 14 - days);
  }

  // Is the ball in the firm's court? If it's on the client, I can't act.
  if (ret.nextActionOwner === "firm") {
    score += 25;
  } else {
    score -= 15;
    reasons.push("waiting on client");
  }

  // Unresolved AI flags need a human decision.
  if (ret.openFlags > 0) {
    score += ret.openFlags * 6;
    reasons.push(`${ret.openFlags} open flag${ret.openFlags > 1 ? "s" : ""}`);
  }

  // Quick wins: fully done, firm just needs to push the button.
  if (ret.stage === "ready_to_file" && ret.nextActionOwner === "firm") {
    score += 20;
    reasons.push("ready to file");
  }

  // Filed work is off the queue.
  if (ret.stage === "filed") {
    score = -100;
    reasons.length = 0;
    reasons.push("filed");
  }

  const urgency: RankedReturn["urgency"] =
    score >= 100 ? "critical" : score >= 70 ? "high" : score >= 35 ? "normal" : "low";

  return {
    ret,
    score,
    reason: reasons.slice(0, 2).join(" · ") || "on track",
    urgency,
  };
}

/** Ranked, highest-priority first. Optionally scoped to one owner's work. */
export function prioritize(
  returns: TaxReturn[],
  opts?: { onlyMine?: boolean; preparer?: string },
): RankedReturn[] {
  let list = returns;
  if (opts?.onlyMine && opts.preparer) {
    list = list.filter(
      (r) => r.preparer === opts.preparer || r.reviewer === opts.preparer,
    );
  }
  return list
    .map(scoreReturn)
    .sort((a, b) => b.score - a.score);
}

// Manager rollup. A manager isn't asking "what do I work on" but "who on the
// team is underwater", so this aggregates each preparer's active load.

export interface PreparerLoad {
  preparer: string;
  active: number;
  overdue: number;
  dueThisWeek: number;
  flags: number;
  waitingOnClient: number;
  /** Highest-priority item currently on their plate. */
  topItem?: RankedReturn;
  /** Pressure index 0 to 100, for the load bar. */
  load: number;
}

export function preparerLoads(returns: TaxReturn[]): PreparerLoad[] {
  const groups = new Map<string, TaxReturn[]>();
  for (const r of returns) {
    if (r.stage === "filed") continue;
    const list = groups.get(r.preparer) ?? [];
    list.push(r);
    groups.set(r.preparer, list);
  }

  const rows: PreparerLoad[] = [];
  for (const [preparer, list] of groups) {
    const overdue = list.filter((r) => daysUntil(r.dueDate) < 0).length;
    const dueThisWeek = list.filter((r) => {
      const d = daysUntil(r.dueDate);
      return d >= 0 && d <= 7;
    }).length;
    const flags = list.reduce((n, r) => n + r.openFlags, 0);
    const waitingOnClient = list.filter((r) => r.nextActionOwner === "client").length;
    const ranked = list.map(scoreReturn).sort((a, b) => b.score - a.score);

    // Weight overdue heaviest, then work due soon, then open flags.
    const raw = overdue * 14 + dueThisWeek * 6 + flags * 2 + list.length * 0.6;
    rows.push({
      preparer,
      active: list.length,
      overdue,
      dueThisWeek,
      flags,
      waitingOnClient,
      topItem: ranked[0],
      load: Math.min(100, Math.round(raw)),
    });
  }

  return rows.sort((a, b) => b.load - a.load);
}
