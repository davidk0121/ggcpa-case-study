import type { ReturnField } from "./types";

/**
 * Challenge 10 — the AI is SIMULATED. This stub stands in for a model call:
 * it returns a plausible response in a fixed shape after a short, faked delay,
 * so the review UI (confidence, evidence, recommended action, corrections)
 * is genuinely wired end-to-end without a real model behind it.
 */

export interface AiReanalysis {
  fieldId: string;
  confidence: number;
  agreesWithCurrent: boolean;
  suggestedValue: number | null;
  rationale: string;
  evidence: string[];
  recommendedAction: "accept" | "review" | "request_from_client";
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Pretend to re-run extraction/reasoning for one field. */
export async function reanalyzeField(field: ReturnField): Promise<AiReanalysis> {
  await wait(750 + (field.id.length % 4) * 150); // feels like real work

  const base = field.ai?.confidence ?? 80;
  const recommendedAction =
    field.verification === "flagged"
      ? field.ai?.concern?.toLowerCase().includes("client")
        ? "request_from_client"
        : "review"
      : base >= 90
        ? "accept"
        : "review";

  return {
    fieldId: field.id,
    confidence: base,
    agreesWithCurrent: true,
    suggestedValue: field.value,
    rationale:
      field.ai?.rationale ??
      "Re-derived this figure from the linked source documents.",
    evidence: field.ai?.evidence ?? [],
    recommendedAction,
  };
}

/** The result of a human correcting the AI — used to update field state. */
export interface CorrectionResult {
  value: number;
  note: string;
}

export function applyCorrection(
  field: ReturnField,
  newValue: number,
  reason: string,
): CorrectionResult {
  return {
    value: newValue,
    note:
      `Overridden by reviewer (was ${field.value ?? "—"}). ` +
      (reason || "No reason given."),
  };
}
