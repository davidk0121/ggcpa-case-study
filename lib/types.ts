/**
 * Domain model for the Ledgerline prototype.
 *
 * The interaction system (Challenge 08) is built on THREE orthogonal axes so
 * the UI can express every combination the case study asks for — what is
 * clickable, editable, AI-generated, verified, awaiting approval, or locked —
 * without a tangle of one-off flags.
 */

/** Where a value came from. Drives the "what is AI vs human" language. */
export type Provenance =
  | "ai" // extracted or computed by the model
  | "human" // typed/confirmed by firm staff
  | "client" // supplied by the client (questionnaire / upload)
  | "carryforward" // pulled from the prior-year filed return
  | "calculated"; // derived from other fields by a formula

/** What the user is allowed to DO with the value. Drives cursor/affordance. */
export type Affordance =
  | "editable" // can be changed inline
  | "readonly" // display only in this context
  | "calculated"; // system-derived; not directly editable, but traceable

/** Trust state. Drives the review workflow (Challenge 10). */
export type Verification =
  | "unverified" // AI produced it, no human has confirmed
  | "verified" // a human confirmed it
  | "flagged"; // conflict / low confidence — needs a decision

export interface SourceRef {
  documentId: string;
  /** Which highlighted box on the rendered form this figure came from. */
  boxId: string;
  boxLabel: string;
  /** The raw value as it appears on the document, before any transformation. */
  rawValue: string;
}

export interface AiMeta {
  /** 0–100. */
  confidence: number;
  /** One-line, human-readable account of what the model did. */
  rationale: string;
  /** Short evidence bullets the reviewer can scan. */
  evidence: string[];
  /** Present when the model is NOT confident — the reason for the flag. */
  concern?: string;
}

export interface ReturnField {
  id: string;
  section: FieldSection;
  /** e.g. "Form 1040, Line 1a". */
  formLine: string;
  label: string;
  /** Numeric value in dollars (null = not yet determined). */
  value: number | null;
  provenance: Provenance;
  affordance: Affordance;
  verification: Verification;
  /** How we got from the source document(s) to this figure. */
  transformation?: string;
  /** One or more source documents backing this figure. */
  sources: SourceRef[];
  /** Field ids this value is computed from (for calculated lines). */
  inputs?: string[];
  ai?: AiMeta;
}

export type FieldSection =
  | "Income"
  | "Adjustments"
  | "Deductions"
  | "Credits"
  | "Payments"
  | "Tax";

/* ------------------------------------------------------------------ */
/* Documents — rendered as real (fake) forms with highlightable boxes  */
/* ------------------------------------------------------------------ */

export type DocType =
  | "W-2"
  | "1099-INT"
  | "1099-DIV"
  | "1099-B"
  | "1098"
  | "K-1";

export interface TaxDocument {
  id: string;
  type: DocType;
  /** Display title, e.g. "W-2 — Northwind Logistics". */
  title: string;
  issuer: string;
  receivedAt: string; // ISO date
  pageCount: number;
  /** Form-specific box values, keyed by boxId. Rendered by the form components. */
  boxes: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/* Returns & clients — powers the dashboard (Challenge 07) + status 06 */
/* ------------------------------------------------------------------ */

export type ReturnStage =
  | "intake" // gathering documents
  | "in_prep" // preparer building the return
  | "in_review" // reviewer checking
  | "client_review" // waiting on client sign-off
  | "ready_to_file" // approved, queued to e-file
  | "filed"; // done

export type Owner = "firm" | "client";

export interface OpenItem {
  id: string;
  label: string;
  owner: Owner;
  kind: "document" | "question" | "signature" | "review";
}

export interface TaxReturn {
  id: string;
  client: string;
  entityType: "Individual" | "Business";
  taxYear: number;
  stage: ReturnStage;
  /** Whose court the ball is in for the NEXT action. */
  nextActionOwner: Owner;
  preparer: string;
  reviewer: string;
  dueDate: string; // ISO date
  /** 0–100 completion. */
  progress: number;
  /** Unresolved AI flags on this return. */
  openFlags: number;
  openItems: OpenItem[];
  /** Estimated refund (+) or balance due (−), in dollars. */
  balance: number;
  lastActivity: string; // ISO datetime
}
