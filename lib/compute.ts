// Return math. The calculated lines are derived from their inputs here rather
// than stored, so overriding a figure (or approving an AI change) moves the
// totals and the refund. The bracket table is a simplified 2025 MFJ schedule,
// not a real tax engine.

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

/** One line of a shown derivation. */
export interface DerivRow {
  /** How this line combines with the running total. */
  op: "+" | "−" | "=" | "→";
  label: string;
  value: number;
  /** Present when the row corresponds to a real field you can navigate to. */
  fieldId?: string;
  /** Subtotals/intermediates aren't clickable and render quieter. */
  subtotal?: boolean;
}

/**
 * The step-by-step derivation shown for a calculated line. Each row carries its
 * own operator (AGI subtracts adjustments, the refund subtracts tax), so the UI
 * doesn't render a wrong equation by assuming everything adds.
 */
export function derivationFor(
  fieldId: string,
  values: Record<string, number | null>,
  b: DerivedBreakdown,
): { rows: DerivRow[]; result: DerivRow } | null {
  const v = (id: string) => values[id] ?? 0;

  switch (fieldId) {
    case "f-total-income":
      return {
        rows: [
          { op: "+", label: "Wages, salaries, tips", value: v("f-wages"), fieldId: "f-wages" },
          { op: "+", label: "Taxable interest", value: v("f-interest"), fieldId: "f-interest" },
          { op: "+", label: "Ordinary dividends", value: v("f-ord-div"), fieldId: "f-ord-div" },
          { op: "+", label: "Capital gain", value: v("f-cap-gains"), fieldId: "f-cap-gains" },
          { op: "+", label: "Partnership income (K-1)", value: v("f-k1-income"), fieldId: "f-k1-income" },
        ],
        result: { op: "=", label: "Total income", value: b.totalIncome },
      };

    case "f-agi":
      return {
        rows: [
          { op: "+", label: "Total income", value: b.totalIncome, fieldId: "f-total-income" },
          { op: "−", label: "HSA deduction", value: v("f-hsa"), fieldId: "f-hsa" },
        ],
        result: { op: "=", label: "Adjusted gross income", value: b.agi },
      };

    case "f-itemized":
      return {
        rows: [
          { op: "+", label: "Home mortgage interest", value: v("f-mortgage-int"), fieldId: "f-mortgage-int" },
          { op: "+", label: "State & local taxes (capped)", value: v("f-salt"), fieldId: "f-salt" },
          { op: "+", label: "Charitable contributions", value: v("f-charity"), fieldId: "f-charity" },
        ],
        result: { op: "=", label: "Total itemized deductions", value: b.itemized },
      };

    case "f-total-tax":
      return {
        rows: [
          { op: "+", label: "Adjusted gross income", value: b.agi, fieldId: "f-agi" },
          {
            op: "−",
            label: `Deduction used (${b.deductionKind})`,
            value: b.deductionUsed,
            fieldId: b.deductionKind === "itemized" ? "f-itemized" : "f-standard",
          },
          { op: "=", label: "Taxable income", value: b.taxableIncome, subtotal: true },
          { op: "→", label: "Tax from 2025 MFJ brackets", value: b.taxBeforeCredits, subtotal: true },
          { op: "−", label: "Child tax credit", value: v("f-ctc"), fieldId: "f-ctc" },
        ],
        result: { op: "=", label: "Total tax", value: b.totalTax },
      };

    case "f-refund":
      return {
        rows: [
          { op: "+", label: "Federal tax withheld", value: v("f-fed-wh"), fieldId: "f-fed-wh" },
          { op: "+", label: "Estimated tax payments", value: v("f-est-pay"), fieldId: "f-est-pay" },
          { op: "−", label: "Total tax", value: b.totalTax, fieldId: "f-total-tax" },
        ],
        result: { op: "=", label: "Refund", value: b.refund },
      };

    default:
      return null;
  }
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
