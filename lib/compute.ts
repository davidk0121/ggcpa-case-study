/**
 * Real (if simplified) return math.
 *
 * Calculated lines are NOT hardcoded — they're derived from their inputs here.
 * That matters for Challenge 01 and 10: when a reviewer overrides a figure or
 * approves an AI-proposed change, the totals and the refund actually move, and
 * the calculation chain shown in the UI stays honest.
 *
 * The bracket table is a simplified 2025 MFJ schedule. It is deliberately not a
 * production tax engine — see the README's "real vs simulated" section.
 */

const MFJ_BRACKETS: Array<{ upTo: number; rate: number }> = [
  { upTo: 23_850, rate: 0.1 },
  { upTo: 96_950, rate: 0.12 },
  { upTo: 206_700, rate: 0.22 },
  { upTo: 394_600, rate: 0.24 },
  { upTo: 501_050, rate: 0.32 },
  { upTo: 751_600, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

export function taxMFJ(taxable: number): number {
  let remaining = Math.max(0, taxable);
  let last = 0;
  let tax = 0;
  for (const { upTo, rate } of MFJ_BRACKETS) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, upTo - last);
    tax += slice * rate;
    remaining -= slice;
    last = upTo;
  }
  return Math.round(tax);
}

/** Ids of the lines this module owns. Everything else is an input. */
export const DERIVED_IDS = [
  "f-total-income",
  "f-agi",
  "f-itemized",
  "f-total-tax",
  "f-refund",
] as const;

export interface DerivedBreakdown {
  totalIncome: number;
  agi: number;
  itemized: number;
  /** Whichever of itemized/standard actually gets used. */
  deductionUsed: number;
  deductionKind: "itemized" | "standard";
  taxableIncome: number;
  taxBeforeCredits: number;
  totalTax: number;
  payments: number;
  refund: number;
}

export function computeReturn(
  values: Record<string, number | null>,
): { derived: Record<string, number>; breakdown: DerivedBreakdown } {
  const g = (id: string) => values[id] ?? 0;

  const totalIncome =
    g("f-wages") + g("f-interest") + g("f-ord-div") + g("f-cap-gains") + g("f-k1-income");

  const agi = totalIncome - g("f-hsa");

  const itemized = g("f-mortgage-int") + g("f-salt") + g("f-charity");
  const standard = g("f-standard");
  const useItemized = itemized >= standard;
  const deductionUsed = useItemized ? itemized : standard;

  const taxableIncome = Math.max(0, agi - deductionUsed);
  const taxBeforeCredits = taxMFJ(taxableIncome);
  const totalTax = Math.max(0, taxBeforeCredits - g("f-ctc"));

  const payments = g("f-fed-wh") + g("f-est-pay");
  const refund = payments - totalTax;

  return {
    derived: {
      "f-total-income": totalIncome,
      "f-agi": agi,
      "f-itemized": itemized,
      "f-total-tax": totalTax,
      "f-refund": refund,
    },
    breakdown: {
      totalIncome,
      agi,
      itemized,
      deductionUsed,
      deductionKind: useItemized ? "itemized" : "standard",
      taxableIncome,
      taxBeforeCredits,
      totalTax,
      payments,
      refund,
    },
  };
}
