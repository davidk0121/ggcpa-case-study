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

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "in 3 days", "today", "2 days ago" — relative to the anchored NOW. */
export function daysUntil(iso: string): number {
  const d = new Date(iso);
  const ms = d.getTime() - NOW.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days}d`;
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
