import type { ReturnField } from "./types";

// Stand-in for a model call. Returns a canned response in a fixed shape after a
// short delay, so the review UI (confidence, evidence, recommended action) is
// wired up without an actual model behind it.

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

/** The result of a human correcting the AI, used to update field state. */
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
