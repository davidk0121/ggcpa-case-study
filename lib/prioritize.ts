import type { TaxReturn } from "./types";
import { daysUntil } from "./format";

/**
 * Challenge 07 — real prioritization logic, not a pretty-but-useless list.
 *
 * We answer ONE question: "what should I work on right now?" So the score
 * rewards work that is (a) mine to move, (b) close to deadline, and
 * (c) blocked on my action. Returns waiting on the CLIENT are deprioritized
 * for the "my queue" view — I can't move them, so they shouldn't top my list.
 *
 * Every ranked item also carries a `reason` so the ordering is explainable,
 * never a black box.
 */

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

  // Deadline pressure — the dominant factor.
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
