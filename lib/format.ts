/** Deterministic "now" so the demo's urgency math is stable and reproducible. */
export const NOW = new Date("2026-08-05T09:30:00");

export function currency(value: number | null, opts?: { cents?: boolean }): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  }).format(value);
}

/** Balance framed for humans: refund vs. balance due. */
export function balanceLabel(value: number): { text: string; kind: "refund" | "due" | "even" } {
  if (value === 0) return { text: "—", kind: "even" };
  if (value > 0) return { text: `${currency(value)} refund`, kind: "refund" };
  return { text: `${currency(Math.abs(value))} due`, kind: "due" };
}

/**
 * Parse a "YYYY-MM-DD" as LOCAL midnight.
 *
 * `new Date("2026-08-12")` parses as UTC midnight, while
 * `new Date("2026-08-05T09:30:00")` parses as local. Mixing the two put every
 * deadline off by a day west of Greenwich. Building from components also keeps
 * the rendered calendar date identical on the server (UTC on Vercel) and in the
 * browser, which avoids a hydration mismatch.
 */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** NOW floored to local midnight, for whole-day arithmetic. */
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

export function shortDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Whole calendar days from today to `iso`. Negative = in the past. */
export function daysUntil(iso: string): number {
  const ms = parseLocalDate(iso).getTime() - TODAY.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days}d`;
}

/**
 * Deadline text that respects the stage. A filed return has no deadline left to
 * miss, so showing "9d overdue" next to "Filed" would contradict itself. Handled
 * here once rather than at each call site.
 */
export function dueDisplay(
  iso: string,
  stage: string,
): { text: string; tone: "overdue" | "soon" | "normal" | "done" } {
  if (stage === "filed") return { text: `filed ${shortDate(iso)}`, tone: "done" };
  const days = daysUntil(iso);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: "overdue" };
  if (days <= 3) return { text: dueLabel(iso), tone: "soon" };
  return { text: dueLabel(iso), tone: "normal" };
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((NOW.getTime() - d.getTime()) / (1000 * 60));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
